import { ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDownloadQueueContext } from "../../components/DownloadQueueContext";
import { isSuccess, mutation, queryKey } from "../../typeUtils";
import { MaybeMissingLevel } from "./useExtendedPlaylist";

export function RowActions({ row }: { row: MaybeMissingLevel }) {
  const { queue, waiting, running } = useDownloadQueueContext();
  const queryClient = useQueryClient();

  const { mutateAsync: deleteLevel } = useMutation({
    ...mutation("levelDelete"),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey("levelGetAll"));
    },
  });

  return row.missing ? (
    <div className="flex">
      <span className="text-red-500 pr-3">Yes</span>
      <ActionIcon
        size="sm"
        variant="outline"
        disabled={
          waiting.some((h) => "hash" in h && h.hash === row.song.hash) ||
          running.some((h) => "hash" in h && h.hash === row.song.hash)
        }
        onClick={(e) => {
          e.stopPropagation();
          queue.enqueue({
            hash: row.song.hash,
            type: "hash",
          });
        }}
      >
        <IconDownload className="size-4/5" />
      </ActionIcon>
    </div>
  ) : (
    <div className="flex">
      <span className="pr-3">No</span>
      <ActionIcon
        size="sm"
        variant="outline"
        disabled={
          waiting.some((h) => "hash" in h && h.hash === row.song.hash) ||
          running.some((h) => "hash" in h && h.hash === row.song.hash)
        }
        onClick={async (e) => {
          e.stopPropagation();
          const res = await deleteLevel(row.song.hash);
          if (isSuccess(res)) {
            notifications.show({
              title: "Deleted",
              message: `Level deleted: ${row.level.info._songName}`,
              color: "green",
            });
          } else {
            notifications.show({
              title: "Error",
              message: `Error deleting level [${row.level.info._songName}]: ${res.error}`,
              color: "red",
            });
          }
        }}
      >
        <IconTrash className="size-4/5" />
      </ActionIcon>
    </div>
  );
}
