export const SpecialPlaylist = {
  All: 0,
  NoPlaylist: 1,
} as const;
/// string: Playlist hash
/// 0: All songs
/// 1: Songs not in any playlist
export type SelectedPlaylist =
  | string
  | (typeof SpecialPlaylist)[keyof typeof SpecialPlaylist];
