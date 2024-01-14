import { Menu, Button } from "@mantine/core";
import { ExtendedPlaylist } from "../useExtendedPlaylist";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mutation, queryKey } from "@/typeUtils";

export function SortPlaylist(props: {
  playlist: ExtendedPlaylist;
  selectedPlaylist: string;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync: updatePlaylist } = useMutation({
    ...mutation("playlistUpdate"),
    onSettled: async () => {
      queryClient.invalidateQueries(queryKey("playlistGetAll"));
    },
  });

  const sortPlaylist = (type: "title", order: "asc" | "desc") => {
    const sorted = [...props.playlist.extendedLevels].sort((a, b) => {
      if (a.song.songName === b.song.songName) return 0;
      if (order === "asc") {
        return a.song.songName < b.song.songName ? -1 : 1;
      } else {
        return a.song.songName > b.song.songName ? -1 : 1;
      }
    });
    updatePlaylist({
      hash: props.selectedPlaylist,
      newPlaylist: {
        ...props.playlist.info,
        songs: sorted.map((l) => l.song),
      },
    });
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button size="xs">Sort playlist</Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item onClick={() => sortPlaylist("title", "asc")}>
          Name: A-Z
        </Menu.Item>
        <Menu.Item onClick={() => sortPlaylist("title", "desc")}>
          Name: Z-A
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
