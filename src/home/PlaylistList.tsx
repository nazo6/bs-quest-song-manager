import { useMemo } from "react";
import { Playlist, isSuccess, query } from "../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../components/Table";
import { Chip, Title } from "@mantine/core";
import { MaybeImage } from "../components/Image";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";

type Props = {
  selectedPlaylist: number | null | "noPlaylist";
  setSelectedPlaylist: (index: number | null | "noPlaylist") => void;
};

export function PlaylistList(props: Props) {
  const { data: playlists } = useQuery(query("playlistGetAll"));

  return playlists && isSuccess(playlists) ? (
    <PlaylistListInner playlists={playlists.data} {...props} />
  ) : null;
}

export function PlaylistListInner(props: Props & { playlists: Playlist[] }) {
  const columns = useMemo<MRT_ColumnDef<Playlist>[]>(
    () => [
      {
        accessorFn: (row) => {
          return (
            <div className="flex items-center h-full">
              <MaybeImage imageString={row.imageString} className="size-10" />
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
    renderDetailPanel: ({ row }) => (
      <div className="flex gap-2">
        <MaybeImage
          imageString={row.original.imageString}
          className="size-20 lg:size-44 flex-shrink-0"
        />
        <div className="flex flex-col *:m-0">
          <Title className="border-solid border-0 border-b" order={4}>
            {row.original.playlistTitle}
          </Title>
          <Title order={5}>Author</Title>
          <p>{row.original.playlistAuthor ?? "--"}</p>
          <Title order={5}>Description</Title>
          <p>{row.original.playlistDescription ?? "--"}</p>
        </div>
      </div>
    ),
    mantineTableBodyRowProps: ({ isDetailPanel, staticRowIndex }) => {
      return {
        className: clsx({
          "*:!bg-blue-500/20 *:mix-blend-multiply *:dark:mix-blend-screen":
            !isDetailPanel && staticRowIndex === props.selectedPlaylist,
          "h-14": !isDetailPanel,
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
