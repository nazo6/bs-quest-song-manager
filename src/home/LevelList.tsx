import { useEffect, useMemo, useState } from "react";
import { ActionIcon, Button, Table, Title } from "@mantine/core";
import { Song } from "../bindings";
import { Level, Playlist } from "../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../components/Table";
import { IconDownload } from "@tabler/icons-react";
import { MaybeImage } from "../components/Image";
import { useBatchDownload } from "../lib/batchDownload";

type PlaylistLevel =
  | {
      missing: false;
      level: Level;
      song: Song;
    }
  | {
      missing: true;
      song: Song;
    };

export function LevelList(props: {
  levelsMap: Record<string, Level>;
  levels: Level[];
  playlist: Playlist | null;
}) {
  const [batchDownload, cancelBatchDownload] = useBatchDownload();
  const [batchDownloading, setBatchDownloading] = useState(false);

  const playlistLevels: PlaylistLevel[] = useMemo(() => {
    if (props.playlist) {
      return props.playlist.songs.map((song) => {
        const level = props.levelsMap[song.hash];
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
    } else {
      return props.levels.map((level) => {
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
    }
  }, [props.levels, props.levelsMap, props.playlist]);
  const missingLevels = playlistLevels.filter((l) => l.missing);

  const columns = useMemo<MRT_ColumnDef<PlaylistLevel>[]>(
    () => [
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
        accessorFn: (row) => {
          return (
            row.missing && (
              <ActionIcon size="sm" disabled={batchDownloading}>
                <IconDownload className="size-4/5" />
              </ActionIcon>
            )
          );
        },
      },
    ],
    [batchDownloading],
  );

  const title = useMemo(() => {
    let title;
    if (props.playlist === null) {
      title = "All levels";
    } else {
      title = `Levels of playlist: ${props.playlist.playlistTitle}`;
    }
    return title;
  }, [props.playlist]);

  const table = useCustomizedTable({
    columns,
    data: playlistLevels,
    title,
    customToolbar: (
      <div className="flex">
        <Button
          size="xs"
          onClick={() => {
            if (batchDownloading) {
              cancelBatchDownload();
            } else {
              setBatchDownloading(true);
              batchDownload(missingLevels.map((l) => l.song.hash)).then(() => {
                setBatchDownloading(false);
              });
            }
          }}
          disabled={missingLevels.length === 0}
        >
          {missingLevels.length === 0
            ? "No missing levels"
            : batchDownloading
              ? "Cancel download"
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    table.resetExpanded();
  }, [props.playlist]);

  return (
    <div className="h-full [&:first-child]:bg-red-500/20 ">
      <MantineReactTable table={table} />;
    </div>
  );
}
