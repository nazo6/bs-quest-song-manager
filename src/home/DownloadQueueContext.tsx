import { ReactNode, createContext, useContext, useState } from "react";

export type DownloadQueueContextType = {
  queue: string[];
  add: (hash: string) => void;
};

const DownloadQueueContext = createContext<DownloadQueueContextType | null>(
  null,
);

export const DownloadQueueProvider = (props: { children: ReactNode }) => {
  const [queue, setQueue] = useState<string[]>([]);

  return (
    <DownloadQueueContext.Provider
      value={{
        queue,
        add: (hash: string) => {
          setQueue([...queue, hash]);
        },
      }}
    >
      {props.children}
    </DownloadQueueContext.Provider>
  );
};

export const useDownloadQueue = () => {
  const context = useContext(DownloadQueueContext);
  if (context === null) {
    throw new Error(
      "useDownloadQueue must be used within a DownloadQueueProvider",
    );
  }
  return context;
};
