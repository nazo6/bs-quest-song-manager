import { useMemo } from "react";
import { Playlist, isSuccess, query } from "../../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../../components/Table";
import { Chip, Title } from "@mantine/core";
import { MaybeImage } from "../../components/Image";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { RowActions } from "./RowActions";

export function PlaylistList(props: {
  selectedPlaylist: number | null | "noPlaylist";
  setSelectedPlaylist: (index: number | null | "noPlaylist") => void;
}) {
  const { data: playlistsRes } = useQuery(query("playlistGetAll"));
  const playlists =
    playlistsRes && isSuccess(playlistsRes) ? playlistsRes.data : [];

  const columns = useMemo<MRT_ColumnDef<Playlist>[]>(
    () => [
      {
        accessorFn: (row) => {
          return (
            <div className="flex items-center h-full">
              <MaybeImage
                imageString={row.info.imageString}
                className="size-10"
              />
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
        accessorFn: (row) => row.info.songs.length,
        header: "Songs",
      },
      {
        header: "Actions",
        Cell: ({ row }) => <RowActions row={row.original} />,
      },
    ],
    [],
  );

  const table = useCustomizedTable({
    columns,
    data: playlists,
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
    renderDetailPanel: ({ row }) => (
      <div className="flex gap-2">
        <MaybeImage
          imageString={row.original.info.imageString}
          className="size-20 lg:size-44 flex-shrink-0"
        />
        <div className="flex flex-col *:m-0">
          <Title className="border-solid border-0 border-b" order={4}>
            {row.original.info.playlistTitle}
          </Title>
          <Title order={5}>Author</Title>
          <p>{row.original.info.playlistAuthor ?? "--"}</p>
          <Title order={5}>Description</Title>
          <p>{row.original.info.playlistDescription ?? "--"}</p>
        </div>
      </div>
    ),
    mantineTableBodyRowProps: ({ isDetailPanel, staticRowIndex, row }) => {
      return {
        className: clsx({
          "*:!bg-blue-500/20 *:mix-blend-multiply *:dark:mix-blend-screen":
            !isDetailPanel && staticRowIndex === props.selectedPlaylist,
          "h-14 cursor-pointer": !isDetailPanel,
        }),
        onClick: () => {
          if (!isDetailPanel) {
            if (staticRowIndex === props.selectedPlaylist) {
              props.setSelectedPlaylist(null);
            } else {
              props.setSelectedPlaylist(staticRowIndex);
            }
          }
        },
      };
    },
  });

  return (
    <div className="h-full">
      <MantineReactTable table={table} />;
    </div>
  );
}
