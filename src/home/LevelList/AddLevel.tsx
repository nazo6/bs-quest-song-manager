import { Button, Checkbox, Input, Modal, Tooltip } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useDownloadQueueContext } from "../../components/DownloadQueueContext";
import { useState } from "react";

export function AddLevel(props: { playlistId: number | null }) {
  const [opened, { close: closeDialog, open }] = useDisclosure(false);
  const { queue } = useDownloadQueueContext();

  const [songId, setSongId] = useState<string>("");
  const [downloadToPlaylist, setDownloadToPlaylist] = useState<boolean>(true);

  const close = () => {
    setSongId("");
    setDownloadToPlaylist(true);
    closeDialog();
  };

  return (
    <>
      <Tooltip label="Change root folder">
        <Button
          classNames={{ label: "flex gap-2" }}
          size="xs"
          onClick={open}
          className="px-2"
        >
          <IconPlus className="size-5 flex-shrink-0" />
          <p>Add level</p>
        </Button>
      </Tooltip>

      <Modal opened={opened} onClose={close} title="Add song">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="song id"
            onInput={(e) => setSongId(e.currentTarget.value)}
          />
          {props.playlistId && (
            <Checkbox
              checked={downloadToPlaylist}
              onChange={(e) => setDownloadToPlaylist(e.currentTarget.checked)}
              label="Download to playlist"
            />
          )}
          <Button
            onClick={() => {
              if (songId === "") return;
              queue.enqueue({
                type: "id",
                id: songId,
                playlistId: props.playlistId ?? undefined,
              });
              close();
            }}
          >
            Queue
          </Button>
        </div>
      </Modal>
    </>
  );
}
