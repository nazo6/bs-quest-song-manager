import { isSuccess, mutation } from "../typeUtils";
import { notifications } from "@mantine/notifications";
import { events } from "../bindings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export type ScanLog = {
  path: string;
  success: boolean;
  message?: string;
  type: "level" | "playlist";
};

export function useScanStart() {
  const queryClient = useQueryClient();

  const { mutateAsync: scanStartReq } = useMutation(mutation("scanStart"));

  const [scanLog, setScanLog] = useState<ScanLog[]>([]);

  const scanStart = async () => {
    const id = notifications.show({
      message: "Scanning directory",
      autoClose: false,
      loading: true,
    });
    let playlistCount = 0;
    let levelCount = 0;
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
          levelCount++;
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
          playlistCount++;
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
        message: `Scan completed: ${levelCount} levels, ${playlistCount} playlists`,
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

  return { scanStart, scanLog };
}
