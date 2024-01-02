import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Scan } from "./Scan";
import { Button, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlaylistList } from "./PlaylistList";
import { useMemo, useState } from "react";
import { LevelList } from "./LevelList";
import { Level, Playlist, isSuccess, mutation, query } from "../typeUtils";

export function Home() {
  const { data: levels } = useQuery(query("levelGetAll"));
  const { data: playlists } = useQuery(query("playlistGetAll"));
  const [scanned, setScanned] = useState(false);

  return levels && playlists && scanned ? (
    isSuccess(levels) && isSuccess(playlists) ? (
      <HomeInner levels={levels.data} playlists={playlists.data} />
    ) : (
      <div>error</div>
    )
  ) : (
    <Scan
      completeScan={() => {
        setScanned(true);
      }}
    />
  );
}

export type UnavailableLevel = {
  hash: string;
  info: {
    _songName: string;
  };
  key?: string;
  unavailable: true;
};

function HomeInner({
  levels,
  playlists,
}: { levels: Level[]; playlists: Playlist[] }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<
    number | null | "noPlaylist"
  >(null);

  const showLevels = useMemo(() => {
    if (selectedPlaylist === null) return levels;

    if (selectedPlaylist === "noPlaylist") {
      return levels.filter((level) => {
        const inPlaylist = playlists.some((playlist) =>
          playlist.songs.some((song) => song.hash === level.hash),
        );
        return !inPlaylist;
      });
    }

    return playlists[selectedPlaylist].songs.map((song) => {
      const level = levels.find((level) => level.hash === song.hash);
      if (!level) {
        return {
          hash: song.hash,
          key: song.key ?? undefined,
          info: {
            _songName: song.songName,
          },
          unavailable: true,
        } satisfies UnavailableLevel;
      }
      return level;
    });
  }, [levels, playlists, selectedPlaylist]);

  return (
    <div className="flex flex-col h-full">
      <Title order={1}>Home</Title>
      <DebugTool />
      <PanelGroup
        direction="horizontal"
        className="flex-grow"
        storage={{
          getItem: () => null,
          setItem: () => {},
        }}
      >
        <Panel defaultSize={50}>
          <PlaylistList
            playlists={playlists}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={setSelectedPlaylist}
          />
        </Panel>
        <PanelResizeHandle className="px-[1px] bg-black" />
        <Panel>
          <LevelList levels={showLevels} />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export function DebugTool() {
  const queryClient = useQueryClient();

  const { mutateAsync: clearLevel } = useMutation(mutation("levelClear"));
  const { mutateAsync: clearPlaylist } = useMutation(mutation("playlistClear"));
  const { mutateAsync: resetConfig } = useMutation(mutation("configReset"));

  const clear = async () => {
    await clearLevel(undefined);
    await clearPlaylist(undefined);
    queryClient.invalidateQueries({ queryKey: ["levelGetAll"] });
    queryClient.invalidateQueries({ queryKey: ["playlistGetAll"] });
  };
  const reset = async () => {
    await clear();
    await resetConfig(undefined);
    queryClient.invalidateQueries({ queryKey: ["configGet"] });
  };

  return (
    <div>
      <Button onClick={clear}>Reset scan data</Button>
      <Button onClick={reset}>Reset config</Button>
    </div>
  );
}
