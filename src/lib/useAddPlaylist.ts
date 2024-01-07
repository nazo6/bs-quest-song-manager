import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isSuccess, mutation } from "../typeUtils";
import { notifications } from "@mantine/notifications";
import { PlaylistInfo } from "../bindings";

export function useAddPlaylistFromUrl() {
  const queryClient = useQueryClient();
  const { mutateAsync: playlistAddFromUrl } = useMutation({
    ...mutation("playlistAddFromUrl"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlistGetAll"] });
    },
  });

  return async (url: string) => {
    const id = notifications.show({
      title: "Adding playlist",
      message: url,
      autoClose: false,
      loading: true,
    });
    const res = await playlistAddFromUrl(url);
    if (isSuccess(res)) {
      notifications.update({
        id,
        title: "Added playlist",
        message: url,
        autoClose: 5000,
        loading: false,
        color: "green",
      });
    } else {
      notifications.update({
        id,
        title: `Failed to add playlist: ${res.error}`,
        message: url,
        autoClose: 5000,
        color: "red",
        loading: false,
      });
    }
  };
}

export function useAddPlaylist() {
  const queryClient = useQueryClient();
  const { mutateAsync: playlistAdd } = useMutation({
    ...mutation("playlistAdd"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlistGetAll"] });
    },
  });

  return async (playlist: PlaylistInfo, fileName: string) => {
    const res = await playlistAdd({
      playlist,
      fileName,
    });
    if (isSuccess(res)) {
      notifications.show({
        title: "Added playlist",
        message: fileName,
        color: "green",
      });
    } else {
      notifications.show({
        title: `Failed to add playlist: ${res.error}`,
        message: fileName,
        color: "red",
      });
    }
  };
}
