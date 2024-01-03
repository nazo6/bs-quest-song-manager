import { Button, Code, Divider, Modal } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mutation } from "../typeUtils";

export function SetRootDirModal(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
}) {
  const [rootDir, setRootDir] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: setModRoot } = useMutation({
    ...mutation("configSetModRoot"),
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ["configGet"] });
    },
  });

  return (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title="Set root directory"
      centered
      size="xl"
      withCloseButton={props.closeable}
      closeOnEscape={props.closeable}
      closeOnClickOutside={props.closeable}
    >
      <div className="flex flex-col gap-3">
        <div>
          Set root directory of beatsaber mod data. This is usually{" "}
          <Code>ModData/com.beatgames.beatsaber</Code> directory.
        </div>
        <div className="flex gap-2 items-center">
          <Button
            className="flex-shrink-0"
            onClick={async () => {
              const dir = await open({ directory: true, multiple: false });
              if (typeof dir !== "string") return;
              setRootDir(dir);
            }}
          >
            Select folder
          </Button>
          {rootDir}
        </div>
        <Divider />
        <Button
          className="ml-auto"
          disabled={rootDir === null || rootDir === ""}
          onClick={async () => {
            if (rootDir) {
              await setModRoot(rootDir);
              close();
            }
          }}
        >
          Apply
        </Button>
      </div>
    </Modal>
  );
}
