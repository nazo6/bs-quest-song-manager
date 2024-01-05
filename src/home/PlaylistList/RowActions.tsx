import { useContextMenu } from "../../components/contextMenu";
import { Playlist } from "../../typeUtils";

export function RowActions({
  row,
  rowRef,
}: {
  row: Playlist;
  rowRef: React.RefObject<HTMLTableRowElement> | undefined;
}) {
  console.log(rowRef);
  useContextMenu(rowRef ?? null, {
    items: [
      {
        label: "aueo",
      },
    ],
  });

  return <div>a</div>;
}
