import { MissingLevel } from "./";
import { useMemo, useState } from "react";
import { ActionIcon, Button } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import pLimit from "p-limit";
import { commands } from "../bindings";
import { Level, Playlist, isSuccess } from "../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../components/Table";
import { IconDownload } from "@tabler/icons-react";

export function LevelList(props: {
  levels: (Level | MissingLevel)[];
  playlist: Playlist | null | "noPlaylist";
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const missingLevels = useMemo(() => {
    return props.levels.filter((level) => "missing" in level) as MissingLevel[];
  }, [props.levels]);

  const { mutateAsync: addLevelByHash } = useMutation({
    mutationFn: commands.levelAddByHash,
  });
  const queryClient = useQueryClient();

  const downloadMissing = async () => {
    notifications.show({
      title: "Downloading levels",
      message: `Downloading ${missingLevels.length} levels`,
    });
    const limit = pLimit(3);
    const promises = [];
    for (const l of missingLevels) {
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

  const columns = useMemo<MRT_ColumnDef<Level | MissingLevel>[]>(
    () => [
      {
        accessorKey: "info._songName",
        header: "Name",
      },
      {
        header: "Download",
        accessorFn: (row) => {
          return (
            "missing" in row && (
              <ActionIcon size="sm">
                <IconDownload className="size-4/5" />
              </ActionIcon>
            )
          );
        },
      },
    ],
    [],
  );

  const title = useMemo(() => {
    let title;
    if (props.playlist === null) {
      title = "All levels";
    } else if (props.playlist === "noPlaylist") {
      title = "Levels not in any playlist";
    } else {
      title = `Levels of playlist: ${props.playlist.playlistTitle}`;
    }
    return title;
  }, [props.playlist]);

  const table = useCustomizedTable({
    columns,
    data: props.levels,
    selected: selectedLevel,
    setSelected: setSelectedLevel,
    title,
    customToolbar: (
      <div className="flex">
        <Button
          size="xs"
          onClick={downloadMissing}
          disabled={missingLevels.length === 0}
        >
          {missingLevels.length === 0
            ? "No missing levels"
            : `Download missing ${missingLevels.length} levels`}
        </Button>
      </div>
    ),
  });

  return (
    <div className="h-full">
      <MantineReactTable table={table} />;
    </div>
  );
}
