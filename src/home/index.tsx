import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PlaylistList } from "./PlaylistList";
import { useMemo, useState } from "react";
import { LevelList } from "./LevelList";
import { Level, Playlist } from "../typeUtils";
import { Topbar } from "./Topbar";

export type UnavailableLevel = {
  hash: string;
  info: {
    _songName: string;
  };
  key?: string;
  unavailable: true;
};

export function Home({
  levels,
  playlists,
}: { levels: Level[]; playlists: Playlist[] }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<
    number | null | "noPlaylist"
  >(null);
  const currentPlaylist = useMemo(() => {
    if (typeof selectedPlaylist === "number") {
      return playlists[selectedPlaylist];
    }
    return selectedPlaylist;
  }, [selectedPlaylist, playlists]);

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
      <Topbar />
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
          <LevelList levels={showLevels} playlist={currentPlaylist} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
