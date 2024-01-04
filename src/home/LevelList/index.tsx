import { useEffect, useMemo } from "react";
import { Button } from "@mantine/core";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../../components/Table";
import { MaybeImage } from "../../components/Image";
import { RowActions } from "./RowActions";
import { ExtendedLevel, useExtendedPlaylist } from "./useExtendedPlaylist";
import { DetailPanel } from "./DetailPanel";
import { useDownloadQueueContext } from "../../components/DownloadQueueContext";

export function LevelList({
  selectedPlaylist,
}: {
  selectedPlaylist: number | null | "noPlaylist";
}) {
  const playlist = useExtendedPlaylist(selectedPlaylist);

  const missingLevels = useMemo(() => {
    return playlist.extendedLevels.filter((l) => l.missing);
  }, [playlist]);

  const { queue } = useDownloadQueueContext();

  const columns = useMemo<MRT_ColumnDef<ExtendedLevel>[]>(() => {
    return [
      {
        header: "#",
        accessorKey: "index",
        size: 50,
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
        Cell: ({ row }) => <RowActions row={row.original} />,
      },
    ];
  }, []);

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
              queue.enqueue({
                hash: l.song.hash,
                type: "hash",
              });
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
    renderDetailPanel: ({ row }) => <DetailPanel row={row.original} />,
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
    table.resetRowSelection();
  }, [selectedPlaylist]);

  return (
    <div className="h-full [&:first-child]:bg-red-500/20 ">
      <MantineReactTable table={table} />
    </div>
  );
}
