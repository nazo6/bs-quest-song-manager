import { ReactNode, createContext, useContext } from "react";
import { useDownloadQueue } from "./DownloadQueue";

const DownloadQueueContext = createContext<ReturnType<
  typeof useDownloadQueue
> | null>(null);

export const DownloadQueueProvider = (props: { children: ReactNode }) => {
  const queue = useDownloadQueue();

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
