import { useQuery } from "@tanstack/react-query";
import { Level, isSuccess, query } from "../../typeUtils";
import { PlaylistInfo, Song } from "../../bindings";
import { useMemo } from "react";
import { SelectedPlaylist } from "..";

export type MaybeMissingLevel =
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
  info: PlaylistInfo;
  extendedLevels: MaybeMissingLevel[];
};

export function useExtendedPlaylist(
  selectedPlaylist: SelectedPlaylist,
): ExtendedPlaylist {
  const { data: levelsRes } = useQuery(query("levelGetAll"));
  const { data: playlistsRes } = useQuery(query("playlistGetAll"));

  const levels = levelsRes && isSuccess(levelsRes) ? levelsRes.data : {};
  const playlists =
    playlistsRes && isSuccess(playlistsRes) ? playlistsRes.data : {};

  const playlist = useMemo(() => {
    if (selectedPlaylist === "noPlaylist") {
      const hashs = new Set(Object.keys(levels));
      for (const playlist of Object.values(playlists)) {
        for (const song of playlist.info.songs) {
          hashs.delete(song.hash);
        }
      }

      const extendedLevels: MaybeMissingLevel[] = [];
      const songs: Song[] = [];

      Array.from(hashs).forEach((hash, i) => {
        const level = levels[hash]!;
        const song = {
          hash,
          songName: level.info._songName,
        };
        songs.push(song);
        extendedLevels.push({
          missing: false,
          level,
          index: i,
          song,
        });
      });

      return {
        info: {
          playlistTitle: "Level not in any playlist",
          imageString: null,
          playlistAuthor: null,
          playlistDescription: null,
          songs,
          image: null,
        },
        extendedLevels,
      } satisfies ExtendedPlaylist;
    } else if (selectedPlaylist !== null && playlists[selectedPlaylist]) {
      const extendedLevels: MaybeMissingLevel[] = playlists[
        selectedPlaylist
      ]!.info.songs.map((song, index) => {
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
      } satisfies ExtendedPlaylist;
    } else {
      const extendedLevels: MaybeMissingLevel[] = [];
      const songs: Song[] = [];
      Object.keys(levels).forEach((level, index) => {
        const song = {
          hash: levels[level]!.hash,
          songName: levels[level]!.info._songName,
        };
        songs.push(song);
        extendedLevels.push({
          missing: false,
          level: levels[level]!,
          index,
          song,
        });
      });
      return {
        info: {
          playlistTitle: "All levels",
          imageString: null,
          playlistAuthor: null,
          playlistDescription: null,
          songs,
          image: null,
        },
        extendedLevels,
      } satisfies ExtendedPlaylist;
    }
  }, [levels, playlists, selectedPlaylist]);

  return playlist;
}
