import { Button } from "@mantine/core";
import { MaybeMissingLevel, ExtendedPlaylist } from "./useExtendedPlaylist";
import { MRT_SelectCheckbox, MRT_TableInstance } from "mantine-react-table";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mutation, queryKey } from "../../typeUtils";
import { SelectedPlaylist } from "..";
import { notifications } from "@mantine/notifications";

export function SelectToolbar({
  table,
  playlistId,
  playlist,
}: {
  table: MRT_TableInstance<MaybeMissingLevel>;
  playlistId: SelectedPlaylist;
  playlist: ExtendedPlaylist;
}) {
  const selected = table.getSelectedRowModel();
  const all = table.getPrePaginationRowModel().rows;

  const queryClient = useQueryClient();

  const { mutateAsync: updatePlaylist } = useMutation({
    ...mutation("playlistUpdate"),
    onSettled: async () => {
      queryClient.invalidateQueries(queryKey("playlistGetAll"));
    },
  });

  const { mutateAsync: deleteLevel } = useMutation({
    ...mutation("levelDelete"),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey("levelGetAll"));
    },
  });

  return (
    <div className="flex gap-2 items-center">
      <MRT_SelectCheckbox selectAll table={table} />
      <div>
        {selected.rows.length} of {all.length}
      </div>
      {typeof playlistId === "number" ? (
        <Button
          size="xs"
          className="flex gap-2 px-2"
          onClick={async () => {
            const newPlaylist = { ...playlist.info };
            newPlaylist.songs = playlist.info.songs.filter(
              (s) =>
                !selected.rows.some((r) => r.original.song.hash === s.hash),
            );
            await updatePlaylist({ hash: playlistId, newPlaylist });
            table.resetRowSelection();
            notifications.show({
              title: "Removed",
              message: `Removed ${selected.rows.length} levels from playlist ${playlist.info.playlistTitle}`,
            });
          }}
        >
          <IconTrash className="size-5" />
          Remove from playlist
        </Button>
      ) : (
        <Button
          size="xs"
          className="flex gap-2 px-2"
          onClick={async () => {
            const promises = selected.rows.map((r) =>
              deleteLevel(r.original.song.hash),
            );
            await Promise.all(promises);
            table.resetRowSelection();
            notifications.show({
              title: "Deleted",
              message: `Deleted ${selected.rows.length} levels`,
            });
          }}
        >
          <IconTrash className="size-5" />
          Delete level
        </Button>
      )}
    </div>
  );
}
