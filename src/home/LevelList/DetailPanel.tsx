import { Table, Title } from "@mantine/core";
import { MaybeImage } from "../../components/Image";
import { MaybeMissingLevel } from "./useExtendedPlaylist";

export function DetailPanel({ row }: { row: MaybeMissingLevel }) {
  const level = row.missing ? null : row.level;
  return (
    <div className="flex gap-2">
      <MaybeImage
        imageString={level?.image_string}
        className="size-20 lg:size-44 flex-shrink-0"
      />
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
        </Table.Tbody>
      </Table>
    </div>
  );
}
