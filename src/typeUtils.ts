import { commands } from "./bindings";

export type Level = Extract<
  Awaited<ReturnType<typeof commands.levelGetAll>>,
  { status: "ok" }
>["data"][number];

export type Playlist = Extract<
  Awaited<ReturnType<typeof commands.playlistGetAll>>,
  { status: "ok" }
>["data"][number];

type __Result__<T, E> =
  | { status: "ok"; data: T }
  | { status: "error"; error: E };
export function isSuccess<R, S, T extends __Result__<R, S>>(
  result: T,
): result is Extract<T, { status: "ok" }> {
  return result.status === "ok";
}

export function query<T extends keyof typeof commands>(command: T) {
  return {
    queryKey: [command],
    queryFn: commands[command],
  };
}

export function mutation<T extends keyof typeof commands>(command: T) {
  return {
    mutationFn: commands[command],
  };
}
