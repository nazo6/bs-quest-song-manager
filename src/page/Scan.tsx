import { UnlistenFn } from "@tauri-apps/api/event";
import { produce } from "immer";
import { useEffect, useState } from "react";
import { events, commands } from "../bindings";
import { Title } from "@mantine/core";

export function Scan() {
  const [scanStatus, setScanStatus] = useState<
    | {
        status: "complete";
        result: CommandResponse<typeof commands.scanStart>;
      }
    | {
        status: "running";
        level: {
          succeed: number;
          failed: number;
        };
        playlist: {
          succeed: number;
          failed: number;
        };
      }
  >({
    status: "running",
    level: {
      succeed: 0,
      failed: 0,
    },
    playlist: {
      succeed: 0,
      failed: 0,
    },
  });

  useEffect(() => {
    let unsubscribe: UnlistenFn | null = null;
    (async () => {
      unsubscribe = await events.scanEvent.listen((e) => {
        setScanStatus((p) =>
          produce(p, (draft) => {
            if (draft?.status === "running") {
              if ("Level" in e.payload) {
                draft.level = e.payload.Level;
              } else {
                draft.playlist = e.payload.Playlist;
              }
            }
          }),
        );
      });
    })();
    (async () => {
      const scanResult = await commands.scanStart();
      console.log(scanResult);
      if (scanResult.status !== "ok") {
        console.error(scanResult);
        return;
      }
      setScanStatus({
        status: "complete",
        result: scanResult.data,
      });
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return scanStatus.status === "running" ? (
    <div className="flex flex-col p-1 items-center h-full">
      <Title order={1}>Scanning</Title>
      <div>
        <span>Levels: </span>
        <span>
          {scanStatus.level.succeed} /{" "}
          {scanStatus.level.succeed + scanStatus.level.failed}
        </span>
      </div>
      <div>
        <span>Playlists: </span>
        <span>
          {scanStatus.playlist.succeed} /{" "}
          {scanStatus.playlist.succeed + scanStatus.playlist.failed}
        </span>
      </div>
    </div>
  ) : (
    <div className="flex flex-col p-1 items-center h-full">
      <Title order={1}>Scan complete</Title>
      <div>
        <span>Levels: </span>
        <span>{scanStatus.result.levels.length}</span>
      </div>
      <div>
        <span>Playlists: </span>
        <span>{scanStatus.result.playlists.length}</span>
      </div>
    </div>
  );
}
