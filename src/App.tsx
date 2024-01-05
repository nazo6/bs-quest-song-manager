import { useQuery } from "@tanstack/react-query";
import { Home } from "./home";
import { Config, isSuccess, query } from "./typeUtils";
import { SetRootDirModal } from "./components/SetRootDir";
import { useDisclosure } from "@mantine/hooks";
import { DownloadQueueProvider } from "./components/DownloadQueueContext";
import { GlobalContextMenu } from "./components/contextMenu";

export default function App() {
  const { data: config } = useQuery(query("configGet"));

  return config && isSuccess(config) ? <AppInner config={config.data} /> : null;
}

function AppInner(props: { config: Config }) {
  const [opened, { close }] = useDisclosure(props.config.mod_root === null);

  return (
    <div className="h-[100vh]">
      <DownloadQueueProvider>
        <GlobalContextMenu />
        <Home />
      </DownloadQueueProvider>
      <SetRootDirModal opened={opened} onClose={close} closeable={false} />
    </div>
  );
}
