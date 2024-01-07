import { Badge, Button, Title } from "@mantine/core";
import { MaybeImage } from "../../components/Image";
import { MaybeMissingLevel } from "./useExtendedPlaylist";
import { useQuery } from "@tanstack/react-query";
import { commands } from "../../bindings";
import { isSuccess } from "../../typeUtils";
import { convertFileSrc } from "@tauri-apps/api/tauri";

export function DetailPanel({
  row,
  isOpen,
}: { row: MaybeMissingLevel; isOpen: boolean }) {
  const { data: remoteInfo, isLoading } = useQuery({
    queryFn: () => commands.levelFetchRemote(row.song.hash),
    queryKey: ["levelFetchRemote", row.song.hash],
    enabled: isOpen,
  });

  const level = row.missing ? null : row.level;

  let imageUrl: string | null = null;
  if (level?.image_path) {
    imageUrl = convertFileSrc(level.image_path);
  } else if (remoteInfo && isSuccess(remoteInfo)) {
    const latestVersion =
      remoteInfo.data.versions[remoteInfo.data.versions.length - 1];
    imageUrl = latestVersion?.coverURL ?? null;
  }

  return (
    <div className="flex gap-2">
      <MaybeImage src={imageUrl} className="size-20 lg:size-44 flex-shrink-0" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Title order={4}>
            {level ? level.info._songName : row.song.songName}
          </Title>
          {!level && <Badge color="red">Missing</Badge>}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {level && (
            <>
              <div className="col-span-1">Sub name</div>
              <div className="col-span-4 break-all">
                {level.info._songSubName}
              </div>
              <div className="col-span-1">Author</div>
              <div className="col-span-4 break-all">
                {level.info._songAuthorName}
              </div>
              <div className="col-span-1">Path</div>
              <div className="col-span-4 break-all">{level.path}</div>
            </>
          )}
          {isLoading ? (
            <div className="col-span-5 text-center">Loading beatsaver...</div>
          ) : remoteInfo && isSuccess(remoteInfo) ? (
            <>
              <div className="col-span-1">Beatsaver id</div>
              <div className="col-span-4 break-all flex gap-2 items-center">
                {remoteInfo.data.id}
                <Button
                  component="a"
                  variant="outline"
                  href={`https://beatsaver.com/maps/${remoteInfo.data.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2"
                  size="compact-xs"
                >
                  Open in beatsaver
                </Button>
                <Button
                  component="a"
                  variant="outline"
                  href={`https://bsaber.com/songs/${remoteInfo.data.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2"
                  size="compact-xs"
                >
                  Open in beastsaber
                </Button>
              </div>
            </>
          ) : (
            <div className="col-span-5 text-center">
              Loading beatsaver failed: {remoteInfo?.error ?? "Unknown error"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
