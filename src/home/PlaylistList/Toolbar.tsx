import { Chip } from "@mantine/core";
import { AddPlaylist } from "./AddPlaylist";
import { SelectedPlaylist, SpecialPlaylist } from "../selectedPlaylist";

export function Toolbar(props: {
  selectedPlaylist: SelectedPlaylist;
  setSelectedPlaylist: (index: SelectedPlaylist) => void;
}) {
  return (
    <div className="flex gap-3">
      <Chip
        checked={props.selectedPlaylist === SpecialPlaylist.NoPlaylist}
        size="xs"
        onClick={() => {
          if (props.selectedPlaylist === SpecialPlaylist.NoPlaylist) {
            props.setSelectedPlaylist(SpecialPlaylist.All);
          } else {
            props.setSelectedPlaylist(SpecialPlaylist.NoPlaylist);
          }
        }}
      >
        Level not in any playlist
      </Chip>
      <AddPlaylist />
    </div>
  );
}
