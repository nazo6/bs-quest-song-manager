import { Chip } from "@mantine/core";
import { SelectedPlaylist } from "..";
import { AddPlaylist } from "./AddPlaylist";

export function Toolbar(props: {
  selectedPlaylist: SelectedPlaylist;
  setSelectedPlaylist: (index: SelectedPlaylist) => void;
}) {
  return (
    <div className="flex gap-3">
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
      <AddPlaylist />
    </div>
  );
}
