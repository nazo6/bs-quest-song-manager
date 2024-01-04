import { useEffect, useMemo } from "react";
import { ActionIcon, Button, Table, Title } from "@mantine/core";
import { Song } from "../bindings";
import { Level, isSuccess, query } from "../typeUtils";
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
      index: number;
    }
  | {
      missing: true;
      song: Song;
      index: number;
    };
type ExtendedPlaylist = {
  playlistTitle: string;
  extendedLevels: ExtendedLevel[];
  imageString: string | null;
  playlistAuthor: string | null;
  playlistDescription: string | null;
};

export function LevelList({
  selectedPlaylist,
}: {
  selectedPlaylist: number | null | "noPlaylist";
}) {
  const { data: levelsRes } = useQuery(query("levelGetAll"));
  const { data: playlistsRes } = useQuery(query("playlistGetAll"));

  const levels = levelsRes && isSuccess(levelsRes) ? levelsRes.data : [];
  const playlists =
    playlistsRes && isSuccess(playlistsRes) ? playlistsRes.data : [];

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
        extendedLevels: Array.from(hashs).map((hash, i) => {
          const level = levelsMap[hash]!;
          return {
            missing: false,
            level,
            index: i,
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
      ]!.songs.map((song, index) => {
        const level = levelsMap[song.hash];
        if (level) {
          return {
            missing: false,
            level,
            song,
            index,
          };
        } else {
          return {
            missing: true,
            song,
            index,
          };
        }
      });
      return {
        extendedLevels,
        ...playlists[selectedPlaylist]!,
      };
    } else {
      const extendedLevels: ExtendedLevel[] = levels.map((level, index) => {
        return {
          missing: false,
          level,
          index,
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
        header: "#",
        accessorKey: "index",
      },
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
        header: "Missing",
        accessorKey: "missing",
        Cell: ({ row }) =>
          row.original.missing && (
            <div className="flex">
              <span className="text-red-500 pr-3">Yes</span>
              <ActionIcon
                size="sm"
                variant="outline"
                disabled={
                  waiting.some((h) => h.hash === row.original.song.hash) ||
                  running.some((h) => h.hash === row.original.song.hash)
                }
                onClick={(e) => {
                  e.stopPropagation();
                  queue.enqueue(row.original.song.hash);
                }}
              >
                <IconDownload className="size-4/5" />
              </ActionIcon>
            </div>
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
              {level ? (
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
              ) : (
                <>
                  <Table.Tr>
                    <Table.Td>Missing</Table.Td>
                    <Table.Td className="text-red-500">Missing</Table.Td>
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
        onClick: () => {
          if (!isDetailPanel) {
            row.toggleExpanded();
          }
        },
      };
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    table.resetExpanded();
  }, [selectedPlaylist]);

  return (
    <div className="h-full [&:first-child]:bg-red-500/20 ">
      <MantineReactTable table={table} />;
    </div>
  );
}
