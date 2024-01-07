import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Button, Input, Popover } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useAddPlaylistFromUrl } from "../../lib/useAddPlaylist";

export function AddPlaylist() {
  const [opened, { close: closeDialog, toggle }] = useDisclosure(false);

  const [playlistUrl, setPlaylistUrl] = useState<string>("");

  const addPlaylist = useAddPlaylistFromUrl();

  const close = () => {
    setPlaylistUrl("");
    closeDialog();
  };

  return (
    <Popover opened={opened} withArrow onClose={closeDialog}>
      <Popover.Target>
        <Button
          classNames={{ label: "flex gap-2" }}
          size="xs"
          onClick={toggle}
          className="px-2"
        >
          <IconPlus className="size-5 flex-shrink-0" />
          <p>Add playlist</p>
        </Button>
      </Popover.Target>
      <Popover.Dropdown className="shadow-xl bg-gray-200 dark:bg-gray-800">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Playlist URL"
            onInput={(e) => setPlaylistUrl(e.currentTarget.value)}
            className="w-96"
          />
          <Button
            onClick={async () => {
              if (playlistUrl === "") return;
              addPlaylist(playlistUrl);
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
