import { useEffect, useState } from "react";
import { events } from "../bindings";
import { Button, Dialog, Overlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useDownloadQueueContext } from "./DownloadQueueContext";

export function LinkHandler() {
  const [toDownload, setToDownload] = useState<string[]>([]);
  const [opened, { close, open }] = useDisclosure(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if ("initialDeepLinkId" in window) {
      const id = window.initialDeepLinkId as string;
      setToDownload([id]);
      open();
    }
    const listener = (async () => {
      return await events.deepLinkEvent.listen((e) => {
        const id = e.payload.id;
        console.log(e);
        console.log("Received deep link event", id);
        setToDownload((prev) => [...prev, id]);
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
      toDownload={toDownload}
      setToDownload={setToDownload}
    />
  );
}

export function LinkHandlerModal(props: {
  opened: boolean;
  onClose: () => void;
  closeable: boolean;
  toDownload: string[];
  setToDownload: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { queue } = useDownloadQueueContext();

  return (
    <>
      <Dialog
        opened={props.opened}
        onClose={props.onClose}
        title="Download level"
        size="xl"
        className="top-20 fixed left-0 right-0 mx-auto"
      >
        <div className="flex flex-col gap-3">
          <div>Download items</div>
          <div className="flex flex-col gap-2">
            {props.toDownload.map((id) => (
              <div className="flex gap-2 items-center" key={id}>
                <div>{id}</div>
                <Button
                  onClick={() => {
                    queue.enqueue({
                      type: "id",
                      id,
                    });
                    props.setToDownload((prev) => prev.filter((i) => i !== id));
                  }}
                >
                  Download
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
