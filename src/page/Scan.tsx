import { useState } from "react";
import { Button, Title } from "@mantine/core";
import { rspc } from "../rspc";
import { useQueryClient } from "@tanstack/react-query";
import { DebugTool } from "./Home";
import { notifications } from "@mantine/notifications";

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

  const { data: config } = rspc.useQuery(["config.get"]);

  const queryClient = useQueryClient();

  const { mutateAsync: startScan } = rspc.useMutation("scan.start", {
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ["level.get_all"] });
      queryClient.invalidateQueries({ queryKey: ["playlist.get_all"] });
    },
  });

  rspc.useSubscription(["scan.log"], {
    onData: (d) => {
      if (typeof d === "string") {
      } else if ("Level" in d) {
        if ("Success" in d.Level) {
          setLevelSuccessCount((prev) => prev + 1);
        } else {
          const text = `Level scan failed: ${d.Level.Failed.path} (${d.Level.Failed.reason})`;
          setLog((p) => {
            return [...p, text];
          });
        }
      } else {
        if ("Success" in d.Playlist) {
          setPlaylistSuccessCount((p) => p + 1);
        } else {
          const text = `Playlist scan failed: ${d.Playlist.Failed.path} (${d.Playlist.Failed.reason})`;
          setLog((p) => {
            return [...p, text];
          });
        }
      }
    },
  });

  return (
    <div>
      <Title>Scan: {config?.mod_root ?? ""}</Title>
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
