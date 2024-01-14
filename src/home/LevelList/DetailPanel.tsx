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
  const { data: dumpInfo, isLoading } = useQuery({
    queryFn: () => commands.cacheDumpGet(row.song.hash),
    queryKey: ["cacheDumpGet", row.song.hash],
    enabled: isOpen,
  });

  const level = row.missing ? null : row.level;

  let imageUrl: string | null = null;
  if (level?.image_path) {
    imageUrl = convertFileSrc(level.image_path, "asset2");
  } else if (dumpInfo && isSuccess(dumpInfo)) {
    imageUrl = `https://cdn.beatsaver.com/${row.song.hash}.jpg`;
  }

  // const imageUrl = levelHashImageUrl(row.song.hash);

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
          {isLoading ? null : dumpInfo && isSuccess(dumpInfo) ? (
            <>
              <div className="col-span-1">Beatsaver id</div>
              <div className="col-span-4 break-all flex gap-2 items-center">
                {dumpInfo.data.Key}
                <Button
                  component="a"
                  variant="outline"
                  href={`https://beatsaver.com/maps/${dumpInfo.data.Key}`}
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
                  href={`https://bsaber.com/songs/${dumpInfo.data.Key}`}
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
              Loading dump data failed: {dumpInfo?.error ?? "Unknown error"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
