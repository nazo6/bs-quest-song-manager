import { Button, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { isSuccess, mutation, query } from "../typeUtils";
import { DebugTool } from "./Home";
import { events } from "../bindings";

export function Scan(props: { completeScan: () => void }) {
  const [levelSuccessCount, setLevelSuccessCount] = useState(0);
  const [playlistSuccessCount, setPlaylistSuccessCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const reset = () => {
    setLevelSuccessCount(0);
    setPlaylistSuccessCount(0);
    setLog([]);
  };

  const [scanning, setScanning] = useState(false);

  const { data: config } = useQuery(query("configGet"));

  const queryClient = useQueryClient();

  const { mutateAsync: startScan } = useMutation({
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ["levelGetAll"] });
      queryClient.invalidateQueries({ queryKey: ["playlistGetAll"] });
    },
    ...mutation("scanStart"),
  });

  useEffect(() => {
    const unsubscribe = events.scanEvent.listen((d) => {
      const event = d.payload;
      console.log(event);
      if (typeof event === "string") {
      } else if ("Level" in event) {
        if ("Success" in event.Level) {
          setLevelSuccessCount((prev) => prev + 1);
        } else {
          const text = `Level scan failed: ${event.Level.Failed.path} (${event.Level.Failed.reason})`;
          setLog((p) => {
            return [...p, text];
          });
        }
      } else {
        if ("Success" in event.Playlist) {
          setPlaylistSuccessCount((p) => p + 1);
        } else {
          const text = `Playlist scan failed: ${event.Playlist.Failed.path} (${event.Playlist.Failed.reason})`;
          setLog((p) => {
            return [...p, text];
          });
        }
      }
    });
    return () => {
      (async () => {
        (await unsubscribe)();
      })();
    };
  }, []);

  return (
    <div>
      <Title>
        Scan: {config && isSuccess(config) ? config.data.mod_root : ""}
      </Title>
      <div className="flex">
        <Button
          onClick={async () => {
            reset();
            try {
              setScanning(true);
              await startScan(undefined);
            } catch (e) {
              const message =
                typeof e === "object" && e && "message" in e
                  ? (e.message as string)
                  : "Unknown error";
              notifications.show({
                title: "Scan failed",
                message,
                color: "red",
              });
            } finally {
              setScanning(false);
            }
          }}
          disabled={scanning}
        >
          Start Scan
        </Button>
        <Button
          onClick={() => {
            props.completeScan();
          }}
        >
          Go home
        </Button>
      </div>
      <DebugTool />
      <p>Level success count: {levelSuccessCount}</p>
      <p>Playlist success count: {playlistSuccessCount}</p>
      <pre>{log.join("\n")}</pre>
    </div>
  );
}
