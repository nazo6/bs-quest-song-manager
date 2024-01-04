import { useQuery } from "@tanstack/react-query";
import { Level, isSuccess, query } from "../../typeUtils";
import { Song } from "../../bindings";
import { useMemo } from "react";

export type ExtendedLevel =
  | {
      missing: false;
      level: Level;
      song: Song;
      index: number;
    }
  | {
      missing: true;
      song: Song;
      index: number;
    };

export type ExtendedPlaylist = {
  playlistTitle: string;
  extendedLevels: ExtendedLevel[];
  imageString: string | null;
  playlistAuthor: string | null;
  playlistDescription: string | null;
};

export function useExtendedPlaylist(
  selectedPlaylist: number | null | "noPlaylist",
): ExtendedPlaylist {
  const { data: levelsRes } = useQuery(query("levelGetAll"));
  const { data: playlistsRes } = useQuery(query("playlistGetAll"));

  const levels = levelsRes && isSuccess(levelsRes) ? levelsRes.data : {};
  const playlists =
    playlistsRes && isSuccess(playlistsRes) ? playlistsRes.data : [];

  const playlist = useMemo(() => {
    if (selectedPlaylist === "noPlaylist") {
      const hashs = new Set(Object.keys(levels));
      for (const playlist of playlists) {
        for (const song of playlist.songs) {
          hashs.delete(song.hash);
        }
      }

      return {
        playlistTitle: "Level not in any playlist",
        extendedLevels: Array.from(hashs).map((hash, i) => {
          const level = levels[hash]!;
          return {
            missing: false,
            level,
            index: i,
            song: {
              key: null,
              hash,
              songName: level.info._songName,
            },
          };
        }),
        imageString: null,
        playlistAuthor: null,
        playlistDescription: null,
      };
    } else if (selectedPlaylist !== null && playlists[selectedPlaylist]) {
      const extendedLevels: ExtendedLevel[] = playlists[
        selectedPlaylist
      ]!.songs.map((song, index) => {
        const level = levels[song.hash];
        if (level) {
          return {
            missing: false,
            level,
            song,
            index,
          };
        } else {
          return {
            missing: true,
            song,
            index,
          };
        }
      });
      return {
        extendedLevels,
        ...playlists[selectedPlaylist]!,
      };
    } else {
      const extendedLevels: ExtendedLevel[] = Object.keys(levels).map(
        (level, index) => {
          return {
            missing: false,
            level: levels[level]!,
            index,
            song: {
              key: null,
              hash: levels[level]!.hash,
              songName: levels[level]!.info._songName,
            },
          };
        },
      );
      return {
        playlistTitle: "All levels",
        extendedLevels,
        imageString: null,
        playlistAuthor: null,
        playlistDescription: null,
      };
    }
  }, [levels, playlists, selectedPlaylist]);

  return playlist;
}
