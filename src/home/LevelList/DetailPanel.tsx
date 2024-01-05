import { Table, Title } from "@mantine/core";
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
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Title</Table.Td>
            <Table.Td>
              <Title order={4}>
                {level ? level.info._songName : row.song.songName}
              </Title>
            </Table.Td>
          </Table.Tr>
          {level ? (
            <>
              <Table.Tr>
                <Table.Td>Author</Table.Td>
                <Table.Td>{level.info._songAuthorName}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Subname</Table.Td>
                <Table.Td>{level.info._songSubName}</Table.Td>
              </Table.Tr>
            </>
          ) : (
            <>
              <Table.Tr>
                <Table.Td>Missing</Table.Td>
                <Table.Td className="text-red-500">Missing</Table.Td>
              </Table.Tr>
            </>
          )}
          <Table.Tr>
            <Table.Td>hash</Table.Td>
            <Table.Td>{row.song.hash}</Table.Td>
          </Table.Tr>
          {isLoading ? (
            <Table.Tr>
              <Table.Td>loading beatsaver data...</Table.Td>
            </Table.Tr>
          ) : remoteInfo && isSuccess(remoteInfo) ? (
            <Table.Tr>
              <Table.Td>beatsaver id</Table.Td>
              <Table.Td>{remoteInfo.data.id}</Table.Td>
            </Table.Tr>
          ) : (
            <Table.Tr>
              <Table.Td>Failed to load beatsaver data</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
