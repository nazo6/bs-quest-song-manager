import { Button, Code, Divider, Modal, Switch } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mutation, queryKey } from "../typeUtils";

export function SetRootDirModal(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
}) {
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
      <SetRootDirModalInner {...props} />
    </Modal>
  );
}

function SetRootDirModalInner(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
}) {
  const [rootDir, setRootDir] = useState<string | null>(null);
  const [adb, setAdb] = useState(false);

  const queryClient = useQueryClient();

  const { mutateAsync: setConnection } = useMutation({
    ...mutation("configSetConnection"),
    onSettled: async () => {
      queryClient.invalidateQueries(queryKey("configGet"));
      queryClient.invalidateQueries(queryKey("levelGetAll"));
      queryClient.invalidateQueries(queryKey("playlistGetAll"));
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div>
        Set root directory of beatsaber mod data. This is usually{" "}
        <Code>ModData/com.beatgames.beatsaber</Code> directory.
      </div>
      <Switch
        checked={adb}
        onChange={(event) => setAdb(event.currentTarget.checked)}
        label="Use ADB"
      />
      <div className="flex gap-2 items-center">
        <Button
          className="flex-shrink-0"
          disabled={adb}
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
        disabled={!adb && (rootDir === null || rootDir === "")}
        onClick={async () => {
          if (adb) {
            await setConnection({
              root: "/storage/emulated/0/ModData/com.beatgames.beatsaber",
              conn_type: "Adb",
            });
            props.onClose();
          } else {
            if (rootDir) {
              await setConnection({
                root: rootDir,
                conn_type: "Local",
              });
              props.onClose();
            }
          }
        }}
      >
        Apply
      </Button>
    </div>
  );
}
