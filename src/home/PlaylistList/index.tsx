import { useMemo } from "react";
import { Playlist, isSuccess, query } from "../../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../../components/Table";
import { Title } from "@mantine/core";
import { MaybeImage, base64ToImgSrc } from "../../components/Image";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { RowActions } from "./RowActions";
import { Toolbar } from "./Toolbar";
import { SelectedPlaylist } from "..";

export function PlaylistList(props: {
  selectedPlaylist: SelectedPlaylist;
  setSelectedPlaylist: (v: SelectedPlaylist) => void;
}) {
  const { data: playlistsRes } = useQuery(query("playlistGetAll"));
  const playlists =
    playlistsRes && isSuccess(playlistsRes) ? playlistsRes.data : {};

  const playlistsArray = useMemo(() => {
    return Object.values(playlists);
  }, [playlists]);

  const columns = useMemo<MRT_ColumnDef<Playlist>[]>(
    () => [
      {
        accessorFn: (row) => {
          return (
            <div className="flex items-center h-full">
              <MaybeImage
                src={base64ToImgSrc(row.info.imageString)}
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
        accessorKey: "info.playlistTitle",
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
    data: playlistsArray,
    selected: props.selectedPlaylist,
    title: "Playlists",
    renderDetailPanel: ({ row }) => (
      <div className="flex gap-2">
        <MaybeImage
          src={base64ToImgSrc(row.original.info.imageString)}
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
    customToolbar: (
      <Toolbar
        selectedPlaylist={props.selectedPlaylist}
        setSelectedPlaylist={props.setSelectedPlaylist}
      />
    ),
    mantineTableBodyRowProps: ({ isDetailPanel, staticRowIndex, row }) => {
      return {
        className: clsx({
          "*:!bg-blue-500/20 *:mix-blend-multiply *:dark:mix-blend-screen":
            !isDetailPanel && row.original.hash === props.selectedPlaylist,
          "h-14 cursor-pointer": !isDetailPanel,
        }),
        onClick: () => {
          if (!isDetailPanel) {
            if (row.original.hash === props.selectedPlaylist) {
              props.setSelectedPlaylist(null);
            } else {
              props.setSelectedPlaylist(row.original.hash);
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
