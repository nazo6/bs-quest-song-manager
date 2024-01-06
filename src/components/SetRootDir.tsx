import { Button, Code, Divider, Modal, Switch } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Config, isSuccess, mutation, query, queryKey } from "../typeUtils";

export function SetRootDirModal(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
}) {
  const { data: config } = useQuery(query("configGet"));

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
      {config && isSuccess(config) && (
        <SetRootDirModalInner {...props} config={config.data} />
      )}
    </Modal>
  );
}

function SetRootDirModalInner(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
  config: Config;
}) {
  const [rootDir, setRootDir] = useState<string | null>(
    props.config.connection?.root ?? null,
  );
  const [adb, setAdb] = useState(props.config.connection?.conn_type === "Adb");

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
    <div className="flex flex-col gap-5">
      <div>
        <p>Set root directory of beatsaber mod data.</p>
        <p>
          Alternatively, you can enable ADB mode to directly access the files on
          Quest. In adb mode, root directory is always{" "}
          <Code>/storage/emulated/0/ModData/com.beatgames.beatsaber</Code>.
        </p>
      </div>
      <Switch
        checked={adb}
        onChange={(event) => {
          if (event.currentTarget.checked) {
            setRootDir("/storage/emulated/0/ModData/com.beatgames.beatsaber");
          } else {
            setRootDir(null);
          }
          setAdb(event.currentTarget.checked);
        }}
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
          if (rootDir) {
            await setConnection({
              root: rootDir,
              conn_type: adb ? "Adb" : "Local",
            });
            props.onClose();
          }
        }}
      >
        Apply
      </Button>
    </div>
  );
}
