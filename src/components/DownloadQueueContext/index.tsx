import { ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { useDownloadQueue } from "./DownloadQueue";
import { notifications } from "@mantine/notifications";

const DownloadQueueContext = createContext<ReturnType<
  typeof useDownloadQueue
> | null>(null);

export const DownloadQueueProvider = (props: { children: ReactNode }) => {
  const queue = useDownloadQueue();

  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) {
      if (queue.waiting.length === 0 && queue.running.length === 0) {
        notifications.show({
          title: "Download Queue",
          message: "All downloads finished",
        });
      }
    } else {
      didMount.current = true;
    }
  }, [queue.waiting, queue.running]);

  return (
    <DownloadQueueContext.Provider value={queue}>
      {props.children}
    </DownloadQueueContext.Provider>
  );
};

export const useDownloadQueueContext = () => {
  const context = useContext(DownloadQueueContext);
  if (context === null) {
    throw new Error(
      "useDownloadQueue must be used within a DownloadQueueProvider",
    );
  }
  return context;
};
