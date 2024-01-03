import { useMemo } from "react";
import { Playlist } from "../typeUtils";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { Button, Title } from "@mantine/core";
import clsx from "clsx";

export function PlaylistList(props: {
  playlists: Playlist[];
  selectedPlaylist: number | null | "noPlaylist";
  setSelectedPlaylist: (index: number | null | "noPlaylist") => void;
}) {
  const columns = useMemo<MRT_ColumnDef<Playlist>[]>(
    () => [
      {
        accessorKey: "playlistTitle",
        header: "Title",
      },
      {
        accessorFn: (row) => row.songs.length,
        header: "Songs",
      },
    ],
    [],
  );
  const table = useMantineReactTable({
    columns,
    data: props.playlists,
    enableRowSelection: true,
    enableColumnOrdering: true,
    enablePagination: false,
    enableRowVirtualization: true,
    initialState: { density: "xs" },
    renderTopToolbarCustomActions: () => {
      return <Title order={4}>Playlists</Title>;
    },
    mantinePaperProps: {
      className: "h-full flex flex-col",
    },
    mantineTableContainerProps: {
      className: "flex-grow",
    },
    mantineTableBodyRowProps: ({ staticRowIndex }) => {
      return {
        className: clsx({
          "*:!bg-blue-500/20 *:mix-blend-multiply":
            staticRowIndex === props.selectedPlaylist,
        }),
        onClick: () => {
          if (staticRowIndex === props.selectedPlaylist) {
            props.setSelectedPlaylist(null);
          } else {
            props.setSelectedPlaylist(staticRowIndex);
          }
        },
      };
    },
    renderBottomToolbar: (
      <div className="flex h-10 items-center border-solid border-x-0 border-b-0 border-t-2 px-2 flex-shrink-0">
        <Button
          size="xs"
          onClick={() => {
            props.setSelectedPlaylist("noPlaylist");
          }}
        >
          Levels not in any playlist
        </Button>
      </div>
    ),
    enableFullScreenToggle: false,
  });

  return (
    <div className="h-full">
      <MantineReactTable table={table} />;
    </div>
  );
}
