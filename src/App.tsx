import { Button, Title } from "@mantine/core";
import { Scan } from "./page/Scan";
import { commands } from "./bindings";
import useSWR from "swr";
import { open } from "@tauri-apps/api/dialog";
import { useState } from "react";

type Config = Extract<
  Awaited<ReturnType<typeof commands.configGet>>,
  { status: "ok" }
>["data"];

function App() {
  const { data: config } = useSWR("config", commands.configGet);

  return (
    <div className="h-[100vh]">
      {config &&
        config.status === "ok" &&
        (config.data.mod_root ? <Scan /> : <Welcome config={config.data} />)}
    </div>
  );
}

function Welcome(props: { config: Config }) {
  const [rootDir, setRootDir] = useState<string | null>(null);

  const { mutate } = useSWR("config", commands.configGet);
  const updateRootDir = async (modRoot: string) => {
    const newConfig = { ...props.config, mod_root: modRoot };
    await commands.configSet(newConfig);
    mutate({ data: newConfig, status: "ok" });
  };

  return (
    <div className="flex flex-col p-1 items-center h-full">
      <Title order={1}>Welcome to the bs song manager</Title>
      <div>
        <Button
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
      <Button
        onClick={async () => {
          if (rootDir) {
            await updateRootDir(rootDir);
          }
        }}
      >
        Apply
      </Button>
    </div>
  );
}

export default App;
