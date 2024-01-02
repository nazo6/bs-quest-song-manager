import { Button, Title } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";
import { useState } from "react";
import { Config, commands } from "./bindings";
import { Home } from "./page/Home";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSuccess, query } from "./typeUtils";

function App() {
  const { data: config } = useQuery(query("configGet"));

  return (
    <div className="h-[100vh]">
      {config &&
        isSuccess(config) &&
        (config.data.mod_root ? <Home /> : <Welcome config={config.data} />)}
    </div>
  );
}

function Welcome(props: { config: Config }) {
  const [rootDir, setRootDir] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: setConfig } = useMutation({
    mutationFn: commands.configSet,
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ["configGet"] });
    },
  });

  return (
    <div className="flex flex-col p-1 items-center h-full">
      <Title order={1}>Welcome to the bs song manager</Title>
      <div>
        <Button
          onClick={async () => {
            const dir = await open({ directory: true, multiple: false });
            console.log(dir);
            if (typeof dir !== "string") return;
            setRootDir(dir);
          }}
        >
          Select folder
        </Button>
        {rootDir}
      </div>
      <Button
        onClick={async () => {
          if (rootDir) {
            await setConfig({ ...props.config, mod_root: rootDir });
          }
        }}
      >
        Apply
      </Button>
    </div>
  );
}

export default App;
