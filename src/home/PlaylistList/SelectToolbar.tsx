import { Button } from "@mantine/core";
import { MRT_SelectCheckbox, MRT_TableInstance } from "mantine-react-table";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Playlist, mutation, queryKey } from "../../typeUtils";
import { notifications } from "@mantine/notifications";

export function SelectToolbar({
  table,
}: {
  table: MRT_TableInstance<Playlist>;
}) {
  const selected = table.getSelectedRowModel();
  const all = table.getPrePaginationRowModel().rows;

  const queryClient = useQueryClient();

  const { mutateAsync: deletePlaylist } = useMutation({
    ...mutation("playlistDelete"),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey("playlistGetAll"));
    },
  });

  return (
    <div className="flex gap-2 items-center">
      <MRT_SelectCheckbox selectAll table={table} />
      <div>
        {selected.rows.length} of {all.length}
      </div>
      <Button
        size="xs"
        className="flex gap-2 px-2"
        onClick={async () => {
          const promises = selected.rows.map((r) => {
            deletePlaylist(r.original.hash);
          });
          await Promise.all(promises);
          table.resetRowSelection();
          notifications.show({
            title: "Deleted",
            message: `Deleted ${selected.rows.length} levels`,
          });
        }}
      >
        <IconTrash className="size-5" />
        Delete selected playlists
      </Button>
    </div>
  );
}
