import { convertFileSrc } from "@tauri-apps/api/tauri";
import { type MRT_ColumnDef, MantineReactTable } from "mantine-react-table";
import { useEffect, useMemo } from "react";
import { MaybeImage, levelHashImageUrl } from "../../components/Image";
import { useCustomizedTable } from "../../components/Table";
import { DetailPanel } from "./DetailPanel";
import { RowActions } from "./RowActions";
import { SelectToolbar } from "./SelectToolbar";
import { Toolbar } from "./Toolbar";
import { MaybeMissingLevel, useExtendedPlaylist } from "./useExtendedPlaylist";
import { SelectedPlaylist } from "../selectedPlaylist";

export function LevelList({
  selectedPlaylist,
}: {
  selectedPlaylist: SelectedPlaylist;
}) {
  const playlist = useExtendedPlaylist(selectedPlaylist);

  const missingLevels = useMemo(() => {
    return playlist.extendedLevels.filter((l) => l.missing);
  }, [playlist]);

  const columns = useMemo<MRT_ColumnDef<MaybeMissingLevel>[]>(() => {
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
                src={
                  row.missing
                    ? levelHashImageUrl(row.song.hash)
                    : convertFileSrc(row.level.image_path)
                }
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
    title: playlist.info.playlistTitle,
    customToolbar: (
      <Toolbar
        missingLevels={missingLevels}
        selectedPlaylist={selectedPlaylist}
        playlist={playlist}
      />
    ),
    renderDetailPanel: ({ row }) => (
      <DetailPanel isOpen={row.getIsExpanded()} row={row.original} />
    ),
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
    renderToolbarAlertBannerContent: ({ table }) => (
      <SelectToolbar
        table={table}
        playlist={playlist}
        selectedPlaylist={selectedPlaylist}
      />
    ),
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
