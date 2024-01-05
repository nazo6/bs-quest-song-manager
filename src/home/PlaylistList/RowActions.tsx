import { useRef } from "react";
import { Playlist } from "../../typeUtils";
import { useContextMenu } from "../../components/contextMenu";

export function RowActions({ row }: { row: Playlist }) {
  const ref = useRef<HTMLDivElement>(null);
  // HACK: I could not find way to access row ref.
  const rowRef = ref.current?.closest("tr") ?? null;

  useContextMenu(rowRef, {
    items: [
      {
        label: row.info.playlistTitle,
        disabled: true,
      },
      {
        is_separator: true,
      },
      {
        label: "Delete",
        event: () => {
          console.log("delete");
        },
      },
    ],
  });

  return <div ref={ref}>a</div>;
}
