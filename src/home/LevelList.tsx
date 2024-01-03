import { UnavailableLevel } from "./";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import pLimit from "p-limit";
import { commands } from "../bindings";
import { Level, Playlist, isSuccess } from "../typeUtils";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  MRT_Virtualizer,
} from "mantine-react-table";
import { Title } from "@mantine/core";
import clsx from "clsx";
import { IconDownload } from "@tabler/icons-react";

export function LevelList(props: {
  levels: (Level | UnavailableLevel)[];
  playlist: Playlist | null | "noPlaylist";
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const { mutateAsync: addLevelByHash } = useMutation({
    mutationFn: commands.levelAddByHash,
  });
  const queryClient = useQueryClient();

  const downloadUnavailable = async () => {
    const levels = props.levels.filter(
      (level) => "unavailable" in level,
    ) as UnavailableLevel[];
    notifications.show({
      title: "Downloading levels",
      message: `Downloading ${levels.length} levels`,
    });
    const limit = pLimit(3);
    const promises = [];
    for (const l of levels) {
      promises.push(
        limit(async () => {
          const level = await addLevelByHash(l.hash);
          if (!isSuccess(level)) {
            notifications.show({
              title: "Failed to download level",
              message: `Failed to download level : ${level.error}`,
            });
            return;
          }

          queryClient.invalidateQueries({
            queryKey: ["levelGetAll"],
          });
          notifications.show({
            title: "Added level",
            message: `Successfully downloaded and added level : ${level.data.info._songName}`,
          });
        }),
      );
    }

    await Promise.all(promises);
  };

  const columns = useMemo<MRT_ColumnDef<Level | UnavailableLevel>[]>(
    () => [
      {
        accessorKey: "info._songName",
        header: "Name",
      },
    ],
    [],
  );

  const rowVirtualizerInstanceRef =
    useRef<MRT_Virtualizer<HTMLDivElement, HTMLTableRowElement>>(null);

  const table = useMantineReactTable({
    columns,
    data: props.levels,
    enableRowSelection: true,
    enableColumnOrdering: true,
    enablePagination: false,
    enableRowVirtualization: true,
    enableRowNumbers: true,
    rowVirtualizerInstanceRef,
    rowVirtualizerOptions: {
      estimateSize: () => 49,
    },
    initialState: { density: "xs" },
    renderTopToolbarCustomActions: () => {
      let text;
      if (props.playlist === null) {
        text = "All levels";
      } else if (props.playlist === "noPlaylist") {
        text = "Levels not in any playlist";
      } else {
        text = `Levels of playlist: ${props.playlist.playlistTitle}`;
      }
      return <Title order={4}>{text}</Title>;
    },
    mantinePaperProps: {
      className: "h-full flex flex-col",
    },
    mantineTableContainerProps: {
      className: "flex-grow",
    },
    mantineTableBodyRowProps: ({ staticRowIndex }) => {
      return {
        className: clsx({
          "*:!bg-blue-500/20 *:mix-blend-multiply":
            staticRowIndex === selectedLevel,
        }),
        onClick: () => {
          if (staticRowIndex === selectedLevel) {
            setSelectedLevel(null);
          } else {
            setSelectedLevel(staticRowIndex);
          }
        },
      };
    },
    enableFullScreenToggle: false,
    renderBottomToolbar: (
      <div className="flex h-10 items-center border-solid border-x-0 border-b-0 border-t-2 px-2 flex-shrink-0">
        <Button
          size="xs"
          leftSection={<IconDownload />}
          onClick={downloadUnavailable}
        >
          Download unavailable
        </Button>
      </div>
    ),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex(0);
    } catch (e) {}
  }, [props.levels]);

  return (
    <div className="h-full">
      <MantineReactTable table={table} />;
    </div>
  );
}
