import { useMemo } from "react";
import { Playlist } from "../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../components/Table";
import { Chip } from "@mantine/core";

export function PlaylistList(props: {
  playlists: Playlist[];
  selectedPlaylist: number | null | "noPlaylist";
  setSelectedPlaylist: (index: number | null | "noPlaylist") => void;
}) {
  const columns = useMemo<MRT_ColumnDef<Playlist>[]>(
    () => [
      {
        accessorFn: (row) => {
          return (
            <div className="flex items-center h-full">
              {row.imageString ? (
                <img
                  src={`data:image/png;base64,${row.imageString}`}
                  alt={row.playlistTitle}
                  className="size-10 border-solid border"
                />
              ) : (
                <div className="size-10" />
              )}
            </div>
          );
        },
        header: "Image",
        size: 50,
        enableColumnOrdering: false,
      },
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

  const table = useCustomizedTable({
    columns,
    data: props.playlists,
    selected: props.selectedPlaylist,
    setSelected: props.setSelectedPlaylist,
    title: "Playlists",
    customToolbar: (
      <div className="flex">
        <Chip
          checked={props.selectedPlaylist === "noPlaylist"}
          size="xs"
          onClick={() => {
            if (props.selectedPlaylist === "noPlaylist") {
              props.setSelectedPlaylist(null);
            } else {
              props.setSelectedPlaylist("noPlaylist");
            }
          }}
        >
          Level not in any playlist
        </Chip>
      </div>
    ),
  });

  return (
    <div className="h-full">
      <MantineReactTable table={table} />;
    </div>
  );
}
