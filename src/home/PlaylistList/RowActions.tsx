import { useRef } from "react";
import { Playlist, mutation, queryKey } from "../../typeUtils";
import { useContextMenu } from "../../components/contextMenu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

export function RowActions({ row }: { row: Playlist }) {
  const ref = useRef<HTMLDivElement>(null);
  // HACK: I could not find way to access row ref.
  const rowRef = ref.current?.closest("tr") ?? null;

  const queryClient = useQueryClient();

  const { mutateAsync: deletePlaylist } = useMutation({
    ...mutation("playlistDelete"),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey("playlistGetAll"));
    },
  });

  useContextMenu(rowRef, {
    items: [
      {
        label: row.info.playlistTitle,
        disabled: true,
      },
      {
        is_separator: true,
      },
      {
        label: "Delete",
        event: () => {
          deletePlaylist(row.hash);
        },
      },
    ],
  });

  return (
    <div ref={ref} className="flex">
      <ActionIcon
        variant="outline"
        size="sm"
        onClick={() => {
          deletePlaylist(row.hash);
        }}
      >
        <IconTrash className="size-4" />
      </ActionIcon>
    </div>
  );
}
