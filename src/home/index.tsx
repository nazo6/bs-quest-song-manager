import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PlaylistList } from "./PlaylistList";
import { useState } from "react";
import { LevelList } from "./LevelList";
import { Topbar } from "./Topbar";

export function Home() {
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
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={setSelectedPlaylist}
          />
        </Panel>
        <PanelResizeHandle className="w-[5px] bg-gray-500/80" />
        <Panel>
          <LevelList selectedPlaylist={selectedPlaylist} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
