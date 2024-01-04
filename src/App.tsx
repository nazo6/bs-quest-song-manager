import { useQuery } from "@tanstack/react-query";
import { Home } from "./home";
import { Config, isSuccess, query } from "./typeUtils";
import { SetRootDirModal } from "./components/SetRootDir";
import { useDisclosure } from "@mantine/hooks";
import { DownloadQueueProvider } from "./components/DownloadQueueContext";

export default function App() {
  const { data: config } = useQuery(query("configGet"));

  return config && isSuccess(config) ? <AppInner config={config.data} /> : null;
}

function AppInner(props: { config: Config }) {
  const { data: levelsRes } = useQuery(query("levelGetAll"));
  const { data: playlistsRes } = useQuery(query("playlistGetAll"));

  const [opened, { close }] = useDisclosure(props.config.mod_root === null);

  const levels = levelsRes && isSuccess(levelsRes) ? levelsRes.data : [];
  const playlists =
    playlistsRes && isSuccess(playlistsRes) ? playlistsRes.data : [];

  return (
    <div className="h-[100vh]">
      <DownloadQueueProvider>
        <Home levels={levels} playlists={playlists} />
      </DownloadQueueProvider>
      <SetRootDirModal opened={opened} onClose={close} closeable={false} />
    </div>
  );
}
