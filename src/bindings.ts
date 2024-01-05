         // This file was generated by [tauri-specta](https://github.com/oscartbeaumont/tauri-specta). Do not edit this file manually.

         export const commands = {
async configGet() : Promise<__Result__<{ mod_root: ModRoot | null }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|config_get") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async configReset() : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|config_reset") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async configSetModRoot(modRoot: string) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|config_set_mod_root", { modRoot }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
/**
 * Return current level state.
 */
async levelGetAll() : Promise<__Result__<{ [key in string]: { hash: string; image_string: string; info: LevelInfo; remote_info: MapDetail | null; path: string } }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|level_get_all") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
/**
 * Clear level state.
 */
async levelStateClear() : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|level_state_clear") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
/**
 * Search, download add level to state and disk.
 */
async levelAddByHash(hash: string) : Promise<__Result__<{ hash: string; image_string: string; info: LevelInfo; remote_info: MapDetail | null; path: string }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|level_add_by_hash", { hash }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
/**
 * Search, download add level to state and disk.
 */
async levelAddById(id: string) : Promise<__Result__<{ hash: string; image_string: string; info: LevelInfo; remote_info: MapDetail | null; path: string }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|level_add_by_id", { id }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
/**
 * Delete levels from state and disk.
 */
async levelDelete(hash: string) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|level_delete", { hash }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async openDevtools() : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|open_devtools") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async playlistGetAll() : Promise<__Result__<{ info: PlaylistInfo; path: string }[], string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|playlist_get_all") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async playlistStateClear() : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|playlist_state_clear") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
/**
 * Adds existing level to playlist.
 * Playlist id is index of playlist in `playlists` array.
 */
async playlistAddLevel(args: PlaylistAddLevelArgs) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|playlist_add_level", { args }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async playlistUpdate(args: PlaylistUpdateArgs) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|playlist_update", { args }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async scanStart() : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|scan_start") };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
}
}

export const events = __makeEvents__<{
scanEvent: ScanEvent,
deepLinkEvent: DeepLinkEvent
}>({
scanEvent: "plugin:tauri-specta:scan-event",
deepLinkEvent: "plugin:tauri-specta:deep-link-event"
})

/** user-defined types **/

export type BeatMap = { _difficulty: string; _difficultyRank: number; _beatmapFilename: string }
export type BeatMapSet = { _difficultyBeatmaps: BeatMap[] }
export type DeepLinkEvent = { id: string }
export type LevelInfo = { _songName: string; _songSubName: string; _songAuthorName: string; _difficultyBeatmapSets: BeatMapSet[]; _coverImageFilename: string }
export type MapDetail = { versions: MapVersion[]; id: string; description: string; stats: MapStats; ranked: boolean; createdAt: string; updatedAt: string; lastPublishedAt: string }
export type MapStats = { plays: number; downloads: number; upvotes: number; downvotes: number; 
/**
 * 0 to 1 ?
 */
score: number }
export type MapVersion = { hash: string; downloadURL: string; coverURL: string; previewURL: string }
export type ModRoot = string
export type PlaylistAddLevelArgs = { playlistId: number; hash: string }
export type PlaylistInfo = { playlistTitle: string; playlistAuthor: string | null; playlistDescription: string | null; image: string | null; imageString: string | null; songs: Song[] }
export type PlaylistUpdateArgs = { playlistId: number; newPlaylist: PlaylistInfo }
export type ScanEvent = { Level: ScanResult } | { Playlist: ScanResult } | "Completed" | "Started"
export type ScanResult = { Success: { path: string } } | { Failed: { reason: string; path: string } }
export type Song = { hash: string; songName: string }

/** tauri-specta globals **/

         import { invoke as TAURI_INVOKE } from "@tauri-apps/api";
import * as TAURI_API_EVENT from "@tauri-apps/api/event";
import { type WebviewWindowHandle as __WebviewWindowHandle__ } from "@tauri-apps/api/window";

type __EventObj__<T> = {
  listen: (
    cb: TAURI_API_EVENT.EventCallback<T>
  ) => ReturnType<typeof TAURI_API_EVENT.listen<T>>;
  once: (
    cb: TAURI_API_EVENT.EventCallback<T>
  ) => ReturnType<typeof TAURI_API_EVENT.once<T>>;
  emit: T extends null
    ? (payload?: T) => ReturnType<typeof TAURI_API_EVENT.emit>
    : (payload: T) => ReturnType<typeof TAURI_API_EVENT.emit>;
};

type __Result__<T, E> =
  | { status: "ok"; data: T }
  | { status: "error"; error: E };

function __makeEvents__<T extends Record<string, any>>(
  mappings: Record<keyof T, string>
) {
  return new Proxy(
    {} as unknown as {
      [K in keyof T]: __EventObj__<T[K]> & {
        (handle: __WebviewWindowHandle__): __EventObj__<T[K]>;
      };
    },
    {
      get: (_, event) => {
        const name = mappings[event as keyof T];

        return new Proxy((() => {}) as any, {
          apply: (_, __, [window]: [__WebviewWindowHandle__]) => ({
            listen: (arg: any) => window.listen(name, arg),
            once: (arg: any) => window.once(name, arg),
            emit: (arg: any) => window.emit(name, arg),
          }),
          get: (_, command: keyof __EventObj__<any>) => {
            switch (command) {
              case "listen":
                return (arg: any) => TAURI_API_EVENT.listen(name, arg);
              case "once":
                return (arg: any) => TAURI_API_EVENT.once(name, arg);
              case "emit":
                return (arg: any) => TAURI_API_EVENT.emit(name, arg);
            }
          },
        });
      },
    }
  );
}

     