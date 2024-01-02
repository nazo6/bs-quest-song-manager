import { DataTable } from "mantine-datatable";
import { Playlist } from "../typeUtils";

export function PlaylistList(props: {
  playlists: Playlist[];
  selectedPlaylist: number | null | "noPlaylist";
  setSelectedPlaylist: (index: number | null | "noPlaylist") => void;
}) {
  return (
    <>
      <div>playlist</div>
      <DataTable
        rowClassName={(_, i) => {
          if (
            i === props.selectedPlaylist ||
            (i === props.playlists.length &&
              props.selectedPlaylist === "noPlaylist")
          ) {
            return "bg-blue-300/30";
          }
          return "";
        }}
        columns={[
          {
            accessor: "playlistTitle",
          },
        ]}
        records={[
          ...props.playlists,
          {
            playlistTitle: "No Playlist",
            songs: [],
          },
        ]}
        idAccessor="playlistTitle"
        onRowClick={({ index }) => {
          if (index === props.playlists.length) {
            if (props.selectedPlaylist === "noPlaylist") {
              props.setSelectedPlaylist(null);
            } else {
              props.setSelectedPlaylist("noPlaylist");
            }
          } else {
            if (props.selectedPlaylist === index) {
              props.setSelectedPlaylist(null);
            } else {
              props.setSelectedPlaylist(index);
            }
          }
        }}
      />
    </>
  );
}
