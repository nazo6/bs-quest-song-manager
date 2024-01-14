import { mutation, queryKey } from "@/typeUtils";
import { Button, Input, Menu, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExtendedPlaylist } from "../useExtendedPlaylist";
import { Song } from "@/bindings";

export function SplitPlaylist(props: {
  playlist: ExtendedPlaylist;
  selectedPlaylist: string;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync: deletePlaylist } = useMutation({
    ...mutation("playlistDelete"),
  });

  const { mutateAsync: addPlaylist } = useMutation({
    ...mutation("playlistAdd"),
  });

  const [opened, { close: closeDialog, toggle }] = useDisclosure(false);

  const [splitCount, setSplitCount] = useState(100);

  const close = () => {
    setSplitCount(100);
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
          <p>Split playlist</p>
        </Button>
      </Popover.Target>
      <Popover.Dropdown className="shadow-xl bg-gray-200 dark:bg-gray-800">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Split count"
            type="number"
            onInput={(e) => setSplitCount(e.currentTarget.valueAsNumber)}
          />
          <Button
            onClick={async () => {
              const title = props.playlist.info.playlistTitle;
              const songs: Song[][] = [];
              console.log(splitCount);
              for (
                let i = 0;
                i < props.playlist.extendedLevels.length;
                i += splitCount
              ) {
                songs.push(
                  props.playlist.extendedLevels
                    .slice(i, i + splitCount)
                    .map((l) => l.song),
                );
              }

              const p = songs.map(async (s, i) => {
                await addPlaylist({
                  fileName: `${title} (${i + 1})`,
                  playlist: {
                    ...props.playlist.info,
                    playlistTitle: `${title} (${i + 1})`,
                    songs: s,
                  },
                });
              });

              await Promise.all(p);
              // await deletePlaylist(props.selectedPlaylist);

              queryClient.invalidateQueries(queryKey("playlistGetAll"));
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
