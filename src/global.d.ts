type CommandResponse<T> = Extract<
  Awaited<ReturnType<T>>,
  { status: "ok" }
>["data"];
