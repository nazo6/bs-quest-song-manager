import { useState } from "react";
import { Button, Title } from "@mantine/core";
import { rspc } from "../rspc";
import { useQueryClient } from "@tanstack/react-query";
import { DebugTool } from "./Home";

export function Scan() {
  const [data, setData] = useState<unknown[]>([]);
  const queryClient = useQueryClient();

  const { mutateAsync: startScan } = rspc.useMutation("scan.start", {
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ["level.get_all"] });
      queryClient.invalidateQueries({ queryKey: ["playlist.get_all"] });
    },
  });

  rspc.useSubscription(["scan.log"], {
    onData: (d) => {
      setData((data) => [...data, d]);
    },
  });

  return (
    <div>
      <Title>Scan</Title>
      <Button
        onClick={async () => {
          await startScan(undefined);
        }}
      >
        Start Scan
      </Button>
      <DebugTool />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
