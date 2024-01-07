import { Button, Checkbox, Input, Popover, Tooltip } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useDownloadQueueContext } from "../../components/DownloadQueueContext";
import { useState } from "react";
import { ExtendedPlaylist } from "./useExtendedPlaylist";
import { SelectedPlaylist } from "..";

export function AddLevel(props: {
  playlistId: SelectedPlaylist;
  playlist: ExtendedPlaylist;
}) {
  const [opened, { close: closeDialog, toggle }] = useDisclosure(false);
  const { queue } = useDownloadQueueContext();

  const [songId, setSongId] = useState<string>("");
  const [downloadToPlaylist, setDownloadToPlaylist] = useState<boolean>(true);

  const close = () => {
    setSongId("");
    setDownloadToPlaylist(true);
    closeDialog();
  };

  return (
    <Popover opened={opened} withArrow onClose={closeDialog}>
      <Popover.Target>
        <Tooltip label="Change root folder">
          <Button
            classNames={{ label: "flex gap-2" }}
            size="xs"
            onClick={toggle}
            className="px-2"
          >
            <IconPlus className="size-5 flex-shrink-0" />
            <p>Add level</p>
          </Button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown className="shadow-xl bg-gray-200 dark:bg-gray-800">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="song id"
            onInput={(e) => setSongId(e.currentTarget.value)}
          />
          {props.playlistId && (
            <Checkbox
              checked={downloadToPlaylist}
              onChange={(e) => setDownloadToPlaylist(e.currentTarget.checked)}
              label={
                <>
                  Download to playlist:{" "}
                  <strong>{props.playlist.info.playlistTitle}</strong>
                </>
              }
            />
          )}
          <Button
            onClick={() => {
              if (songId === "") return;
              queue.enqueue({
                type: "id",
                id: songId,
                playlistId:
                  typeof props.playlistId === "number"
                    ? props.playlistId
                    : undefined,
              });
              close();
            }}
          >
            Apply
          </Button>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
