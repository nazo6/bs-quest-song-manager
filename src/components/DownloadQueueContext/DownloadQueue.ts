import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Level, isSuccess, mutation, queryKey } from "../../typeUtils";
import { useState } from "react";

export type DownloadResult = { status: "ok" } | { status: "error" };
export type DownloadJob = () => Promise<DownloadResult>;
export type DownloadQueueItem = {
  queueId: number;
  playlistHash?: string;
} & (
  | {
      type: "hash";
      hash: string;
    }
  | {
      type: "id";
      id: string;
    }
);
export type DownloadQueueItemParam = {
  playlistHash?: string;
} & (
  | {
      type: "hash";
      hash: string;
    }
  | {
      type: "id";
      id: string;
    }
);

export class DownloadQueue {
  private _queue: DownloadQueueItem[];

  private downloader: (queueItem: DownloadQueueItem) => Promise<DownloadResult>;

  private concurrent: number;
  private maxConcurrent: number;
  private maxId = 0;

  private onStart?: (queueItem: DownloadQueueItem) => void;
  private onResolve?: (
    queueItem: DownloadQueueItem,
    result: DownloadResult,
  ) => void;
  private onQueueChange?: (queue: DownloadQueueItem[]) => void;

  constructor(opts: {
    maxConcurrent: number;
    downloader: (queueItem: DownloadQueueItem) => Promise<DownloadResult>;
    onStart?: (queueItem: DownloadQueueItem) => void;
    onResolve?: (queueItem: DownloadQueueItem, result: DownloadResult) => void;
    onQueueChange?: (queue: DownloadQueueItem[]) => void;
  }) {
    this._queue = [];
    this.concurrent = 0;
    this.maxConcurrent = opts.maxConcurrent;
    this.downloader = opts.downloader;
    this.onStart = opts.onStart;
    this.onResolve = opts.onResolve;
    this.onQueueChange = opts.onQueueChange;
  }

  public enqueue(item: DownloadQueueItemParam) {
    this.maxId++;
    this._queue.push({ ...item, queueId: this.maxId });
    this.onQueueChange?.(this._queue);
    this.nextJob();
  }

  public cancelAll() {
    this._queue = [];
    this.concurrent = 0;
    this.onQueueChange?.(this._queue);
  }

  public cancel(id: number) {
    this._queue = this._queue.filter((item) => item.queueId !== id);
    this.onQueueChange?.(this._queue);
  }

  private nextJob() {
    if (this.concurrent > this.maxConcurrent) return;
    const next = this._queue.shift();
    if (next) {
      this.onStart?.(next);
      this.onQueueChange?.(this._queue);
      this.concurrent++;
      this.downloader(next).then((value: DownloadResult) => {
        this.onResolve?.(next, value);
        this.concurrent--;
        this.nextJob();
      });
    }
  }
}

export function useDownloadQueue() {
  const queryClient = useQueryClient();

  const { mutateAsync: addLevelByHash } = useMutation({
    ...mutation("levelAddByHash"),
    onSettled: async () => {
      queryClient.invalidateQueries(queryKey("levelGetAll"));
    },
  });
  const { mutateAsync: addLevelById } = useMutation({
    ...mutation("levelAddById"),
    onSettled: async () => {
      queryClient.invalidateQueries(queryKey("levelGetAll"));
    },
  });

  const { mutateAsync: addLevelToPlaylist } = useMutation({
    ...mutation("playlistAddLevel"),
    onSettled: async () => {
      queryClient.invalidateQueries(queryKey("playlistGetAll"));
    },
  });

  const [completed, setCompleted] = useState<
    {
      queueItem: DownloadQueueItem;
      result: DownloadResult;
    }[]
  >([]);
  const [waiting, setWaiting] = useState<DownloadQueueItem[]>([]);
  const [running, setRunning] = useState<DownloadQueueItem[]>([]);

  const queue = new DownloadQueue({
    maxConcurrent: 3,
    downloader: async (queueItem) => {
      let level: Level;
      if (queueItem.type === "hash") {
        const res = await addLevelByHash(queueItem.hash);
        if (!isSuccess(res)) {
          return res;
        }
        level = res.data;
      } else {
        const res = await addLevelById(queueItem.id);
        if (!isSuccess(res)) {
          return res;
        }
        level = res.data;
      }
      if (queueItem.playlistHash) {
        await addLevelToPlaylist({
          playlistHash: queueItem.playlistHash,
          levelHash: level.hash,
        });
      }
      return { status: "ok" };
    },
    onStart: (queueItem: DownloadQueueItem) => {
      setRunning((prev) => [...prev, queueItem]);
    },
    onResolve: (queueItem: DownloadQueueItem, result: DownloadResult) => {
      setCompleted((prev) => [...prev, { queueItem, result }]);
      setRunning((prev) =>
        prev.filter((item) => item.queueId !== queueItem.queueId),
      );
    },
    onQueueChange: (queue: DownloadQueueItem[]) => {
      setWaiting([...queue]);
    },
  });

  return {
    queue,
    completed,
    waiting,
    running,
  };
}
