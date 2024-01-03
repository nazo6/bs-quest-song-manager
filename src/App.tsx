import { useQuery } from "@tanstack/react-query";
import { Home } from "./home";
import { Config, isSuccess, query } from "./typeUtils";
import { SetRootDirModal } from "./components/SetRootDir";
import { useDisclosure } from "@mantine/hooks";

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
      <Home levels={levels} playlists={playlists} />
      <SetRootDirModal opened={opened} onClose={close} closeable={false} />
    </div>
  );
}
