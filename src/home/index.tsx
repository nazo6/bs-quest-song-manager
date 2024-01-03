import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PlaylistList } from "./PlaylistList";
import { useMemo, useState } from "react";
import { LevelList } from "./LevelList";
import { Level, Playlist } from "../typeUtils";
import { Topbar } from "./Topbar";

export function Home({
  levels,
  playlists,
}: { levels: Level[]; playlists: Playlist[] }) {
  const levelsMap = useMemo(() => {
    const map: Record<string, Level> = {};
    for (const level of levels) {
      if (!(level.hash in map)) {
        map[level.hash] = level;
      }
    }
    return map;
  }, [levels]);

  /// Playlist of levels that are not in any playlist
  const noPlaylist: Playlist = useMemo(() => {
    const hashs = new Set(Object.keys(levelsMap));
    for (const playlist of playlists) {
      for (const song of playlist.songs) {
        hashs.delete(song.hash);
      }
    }

    return {
      playlistTitle: "Level not in any playlist",
      songs: Array.from(hashs).map((hash) => {
        const level = levelsMap[hash]!;
        return {
          hash,
          key: null,
          songName: level.info._songName,
        };
      }),
      imageString: null,
      image: null,
      playlistAuthor: null,
      playlistDescription: null,
    };
  }, [levelsMap, playlists]);

  const [selectedPlaylist, setSelectedPlaylist] = useState<
    number | null | "noPlaylist"
  >(null);

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
        <PanelResizeHandle className="w-[5px] bg-gray-500/80" />
        <Panel>
          <LevelList
            levels={levels}
            levelsMap={levelsMap}
            playlist={
              selectedPlaylist === "noPlaylist"
                ? noPlaylist
                : selectedPlaylist
                  ? playlists[selectedPlaylist] ?? null
                  : null
            }
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
