import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PlaylistList } from "./PlaylistList";
import { useState } from "react";
import { LevelList } from "./LevelList";
import { Topbar } from "./Topbar";
import { LinkHandler } from "../components/LinkHandler";

export function Home() {
  return (
    <div className="flex flex-col h-full">
      <Topbar />
      <Main />
    </div>
  );
}

function Main() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<
    number | null | "noPlaylist"
  >(null);

  return (
    <div className="flex-grow relative min-h-0">
      <LinkHandler />
      <PanelGroup
        direction="horizontal"
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
