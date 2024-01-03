import { ActionIcon, Title, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFolder, IconRefresh } from "@tabler/icons-react";
import { SetRootDirModal } from "../components/SetRootDir";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isSuccess, mutation } from "../typeUtils";
import { notifications } from "@mantine/notifications";
import { events } from "../bindings";
import { useState } from "react";

type ScanLog = {
  path: string;
  success: boolean;
  message?: string;
  type: "level" | "playlist";
};

export function Topbar() {
  const queryClient = useQueryClient();

  const [opened, { close, open }] = useDisclosure(false);

  const { mutateAsync: scanStartReq } = useMutation(mutation("scanStart"));

  const [scanLog, setScanLog] = useState<ScanLog[]>([]);

  const scanStart = async () => {
    const id = notifications.show({
      message: "Scanning directory",
      autoClose: false,
      loading: true,
    });
    const unsubscribe = await events.scanEvent.listen((d) => {
      const event = d.payload;
      if (typeof event === "string") {
        return;
      }
      let log: ScanLog;
      if ("Level" in event) {
        if ("Success" in event.Level) {
          log = {
            path: event.Level.Success.path,
            success: true,
            type: "level",
          };
        } else {
          log = {
            path: event.Level.Failed.path,
            success: false,
            message: `Level scan failed: ${event.Level.Failed.path} (${event.Level.Failed.reason})`,
            type: "level",
          };
        }
      } else {
        if ("Success" in event.Playlist) {
          log = {
            path: event.Playlist.Success.path,
            success: true,
            type: "level",
          };
        } else {
          log = {
            path: event.Playlist.Failed.path,
            success: false,
            message: `Playlist scan failed: ${event.Playlist.Failed.path} (${event.Playlist.Failed.reason})`,
            type: "level",
          };
        }
        setScanLog((prev) => [...prev, log]);
        notifications.update({
          id,
          message: `Scanned ${scanLog.length} items`,
          autoClose: false,
          loading: true,
        });
      }
    });
    const data = await scanStartReq();
    if (data && isSuccess(data)) {
      notifications.update({
        id,
        autoClose: true,
        loading: false,
        message: "Scan completed",
      });
      queryClient.invalidateQueries({ queryKey: ["levelGetAll"] });
      queryClient.invalidateQueries({ queryKey: ["playlistGetAll"] });
    } else {
      notifications.update({
        id,
        message: `Scan failed: ${data.error}`,
        autoClose: true,
        loading: false,
        color: "red",
      });
    }
    unsubscribe();
  };

  return (
    <>
      <div className="h-11 py-2 flex items-center gap-2 bg-gray-500/20 pl-2">
        <Title order={3}>BQSM</Title>
        <Tooltip label="Change root folder">
          <ActionIcon variant="filled" aria-label="Settings" onClick={open}>
            <IconFolder style={{ width: "70%", height: "70%" }} stroke={1.5} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Scan">
          <ActionIcon
            variant="filled"
            aria-label="Settings"
            onClick={() => {
              scanStart();
            }}
          >
            <IconRefresh style={{ width: "70%", height: "70%" }} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </div>

      <SetRootDirModal opened={opened} onClose={close} closeable={true} />
    </>
  );
}
