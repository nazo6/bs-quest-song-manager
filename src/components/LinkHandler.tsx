import { useEffect, useState } from "react";
import { events } from "../bindings";
import { Button, Dialog, Overlay, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useDownloadQueueContext } from "./DownloadQueueContext";
import { useAddPlaylistFromUrl } from "../lib/useAddPlaylist";

export function LinkHandler() {
  const [levels, setLevels] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [opened, { close, open }] = useDisclosure(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if ("initialDeepLinkLevel" in window) {
      const id = window.initialDeepLinkLevel as string;
      setLevels([id]);
      open();
    }
    if ("initialDeepLinkPlaylist" in window) {
      const url = window.initialDeepLinkPlaylist as string;
      setPlaylists([url]);
      open();
    }
    const listener = (async () => {
      return await events.deepLinkEvent.listen((e) => {
        if ("Level" in e.payload) {
          const id = e.payload.Level.id;
          if (levels.includes(id)) return;
          setLevels((prev) => [...prev, id]);
        } else {
          const url = e.payload.Playlist.url;
          if (playlists.includes(url)) return;
          setPlaylists((prev) => [...prev, url]);
        }
        open();
      });
    })();
    return () => {
      (async () => {
        const unlisten = await listener;
        unlisten();
      })();
    };
  }, []);

  return (
    <LinkHandlerModal
      opened={opened}
      onClose={close}
      closeable={true}
      levels={levels}
      setLevels={setLevels}
      playlists={playlists}
      setPlaylists={setPlaylists}
    />
  );
}

export function LinkHandlerModal(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
  levels: string[];
  setLevels: React.Dispatch<React.SetStateAction<string[]>>;
  playlists: string[];
  setPlaylists: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { queue } = useDownloadQueueContext();
  const addPlaylistFromUrl = useAddPlaylistFromUrl();

  return (
    <>
      <Dialog
        opened={props.opened}
        onClose={props.onClose}
        title="Download level"
        size="xl"
        className="top-20 fixed left-0 right-0 mx-auto w-3/4"
      >
        <div className="flex flex-col gap-3">
          <div>Download items</div>
          <div className="flex flex-col gap-2">
            <Title order={5}>Levles</Title>
            {props.levels.map((id) => (
              <div className="flex gap-2 items-center" key={id}>
                <div>{id}</div>
                <Button
                  onClick={() => {
                    queue.enqueue({
                      type: "id",
                      id,
                    });
                    props.setLevels((prev) => prev.filter((i) => i !== id));
                  }}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Title order={5}>Playlists</Title>
            {props.playlists.map((url) => (
              <div className="flex gap-2 items-center" key={url}>
                <div className="break-all">{url}</div>
                <Button
                  className="flex-shrink-0"
                  onClick={async () => {
                    props.setPlaylists((prev) => prev.filter((i) => i !== url));
                    addPlaylistFromUrl(url);
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Dialog>
      {props.opened && (
        <Overlay color="#000" backgroundOpacity={0.7} onClick={props.onClose} />
      )}
    </>
  );
}
