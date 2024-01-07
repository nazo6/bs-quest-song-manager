import { Button } from "@mantine/core";
import { MaybeMissingLevel, ExtendedPlaylist } from "./useExtendedPlaylist";
import { useDownloadQueueContext } from "../../components/DownloadQueueContext";
import { AddLevel } from "./AddLevel";
import { SelectedPlaylist } from "../selectedPlaylist";

export function Toolbar(props: {
  missingLevels: MaybeMissingLevel[];
  selectedPlaylist: SelectedPlaylist;
  playlist: ExtendedPlaylist;
}) {
  const { queue } = useDownloadQueueContext();

  return (
    <div className="flex gap-2">
      <Button
        size="xs"
        onClick={() => {
          for (const l of props.missingLevels) {
            queue.enqueue({
              hash: l.song.hash,
              type: "hash",
            });
          }
        }}
        disabled={props.missingLevels.length === 0}
      >
        {props.missingLevels.length === 0
          ? "No missing levels"
          : `Download missing ${props.missingLevels.length} levels`}
      </Button>
      <AddLevel
        playlist={props.playlist}
        selectedPlaylist={props.selectedPlaylist}
      />
    </div>
  );
}
