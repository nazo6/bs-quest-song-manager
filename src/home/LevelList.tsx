import { useEffect, useMemo } from "react";
import { ActionIcon, Button, Table, Title } from "@mantine/core";
import { Song } from "../bindings";
import { Level, Playlist, isSuccess, query } from "../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../components/Table";
import { IconDownload } from "@tabler/icons-react";
import { MaybeImage } from "../components/Image";
import { useDownloadQueueContext } from "../components/DownloadQueueContext";
import { useQuery } from "@tanstack/react-query";

type ExtendedLevel =
  | {
      missing: false;
      level: Level;
      song: Song;
    }
  | {
      missing: true;
      song: Song;
    };
type ExtendedPlaylist = {
  playlistTitle: string;
  extendedLevels: ExtendedLevel[];
  imageString: string | null;
  playlistAuthor: string | null;
  playlistDescription: string | null;
};

export function LevelList(props: {
  selectedPlaylist: number | null | "noPlaylist";
}) {
  const { data: levels } = useQuery(query("levelGetAll"));
  const { data: playlists } = useQuery(query("playlistGetAll"));

  return levels && isSuccess(levels) && playlists && isSuccess(playlists) ? (
    <LevelListInner
      levels={levels.data}
      playlists={playlists.data}
      selectedPlaylist={props.selectedPlaylist}
    />
  ) : null;
}

export function LevelListInner({
  levels,
  playlists,
  selectedPlaylist,
}: {
  levels: Level[];
  playlists: Playlist[];
  selectedPlaylist: number | null | "noPlaylist";
}) {
  const levelsMap = useMemo(() => {
    const map: Record<string, Level> = {};
    for (const level of levels) {
      if (!(level.hash in map)) {
        map[level.hash] = level;
      }
    }
    return map;
  }, [levels]);

  const playlist: ExtendedPlaylist = useMemo(() => {
    if (selectedPlaylist === "noPlaylist") {
      const hashs = new Set(Object.keys(levelsMap));
      for (const playlist of playlists) {
        for (const song of playlist.songs) {
          hashs.delete(song.hash);
        }
      }

      return {
        playlistTitle: "Level not in any playlist",
        extendedLevels: Array.from(hashs).map((hash) => {
          const level = levelsMap[hash]!;
          return {
            missing: false,
            level,
            song: {
              key: null,
              hash,
              songName: level.info._songName,
            },
          };
        }),
        imageString: null,
        image: null,
        playlistAuthor: null,
        playlistDescription: null,
      };
    } else if (selectedPlaylist && playlists[selectedPlaylist]) {
      const extendedLevels: ExtendedLevel[] = playlists[
        selectedPlaylist
      ]!.songs.map((song) => {
        const level = levelsMap[song.hash];
        if (level) {
          return {
            missing: false,
            level,
            song,
          };
        } else {
          return {
            missing: true,
            song,
          };
        }
      });
      return {
        extendedLevels,
        ...playlists[selectedPlaylist]!,
      };
    } else {
      const extendedLevels: ExtendedLevel[] = levels.map((level) => {
        return {
          missing: false,
          level,
          song: {
            key: null,
            hash: level.hash,
            songName: level.info._songName,
          },
        };
      });
      return {
        playlistTitle: "All levels",
        extendedLevels,
        imageString: null,
        playlistAuthor: null,
        playlistDescription: null,
      };
    }
  }, [selectedPlaylist, playlists, levelsMap, levels]);

  const missingLevels = useMemo(() => {
    return playlist.extendedLevels.filter((l) => l.missing);
  }, [playlist]);

  const { queue, waiting, running } = useDownloadQueueContext();

  const columns = useMemo<MRT_ColumnDef<ExtendedLevel>[]>(() => {
    return [
      {
        header: "Image",
        size: 50,
        accessorFn: (row) => {
          return (
            <div className="flex items-center h-full">
              <MaybeImage
                imageString={row.missing ? null : row.level.image_string}
                className="size-10"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "song.songName",
        header: "Name",
      },
      {
        header: "Download",
        accessorKey: "missing",
        Cell: ({ row }) =>
          row.original.missing && (
            <ActionIcon
              size="sm"
              variant="outline"
              disabled={
                waiting.some((h) => h.hash === row.original.song.hash) ||
                running.some((h) => h.hash === row.original.song.hash)
              }
              onClick={() => queue.enqueue(row.original.song.hash)}
            >
              <IconDownload className="size-4/5" />
            </ActionIcon>
          ),
      },
    ];
  }, [waiting, running, queue]);

  const table = useCustomizedTable({
    columns,
    data: playlist.extendedLevels,
    title: playlist.playlistTitle,
    customToolbar: (
      <div className="flex">
        <Button
          size="xs"
          onClick={() => {
            for (const l of missingLevels) {
              queue.enqueue(l.song.hash);
            }
          }}
          disabled={missingLevels.length === 0}
        >
          {missingLevels.length === 0
            ? "No missing levels"
            : `Download missing ${missingLevels.length} levels`}
        </Button>
      </div>
    ),
    renderDetailPanel: ({ row }) => {
      const level = row.original.missing ? null : row.original.level;
      return (
        <div className="flex gap-2">
          <MaybeImage
            imageString={level?.image_string}
            className="size-20 lg:size-44 flex-shrink-0"
          />
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Title</Table.Td>
                <Table.Td>
                  <Title order={4}>
                    {level ? level.info._songName : row.original.song.songName}
                  </Title>
                </Table.Td>
              </Table.Tr>
              {level && (
                <>
                  <Table.Tr>
                    <Table.Td>Author</Table.Td>
                    <Table.Td>{level.info._songAuthorName}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Subname</Table.Td>
                    <Table.Td>{level.info._songSubName}</Table.Td>
                  </Table.Tr>
                </>
              )}
              <Table.Tr>
                <Table.Td>hash</Table.Td>
                <Table.Td>{row.original.song.hash}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>
      );
    },
    mantineTableBodyRowProps: ({ isDetailPanel, row }) => {
      return {
        className:
          !isDetailPanel && row.original.missing
            ? "[&>:first-child]:!bg-red-500/20 [&>:first-child]:mix-blend-multiply [&>:first-child]:dark:mix-blend-screen"
            : "",
      };
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    table.resetExpanded();
  }, [playlist]);

  return (
    <div className="h-full [&:first-child]:bg-red-500/20 ">
      <MantineReactTable table={table} />;
    </div>
  );
}
