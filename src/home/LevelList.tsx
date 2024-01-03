import { useMemo, useState } from "react";
import { ActionIcon, Button } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import pLimit from "p-limit";
import { Song, commands } from "../bindings";
import { Level, Playlist, isSuccess } from "../typeUtils";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { useCustomizedTable } from "../components/Table";
import { IconDownload } from "@tabler/icons-react";

type PlaylistLevel =
  | {
      missing: false;
      level: Level;
      song: Song;
    }
  | {
      missing: true;
      song: Song;
    };

export function LevelList(props: {
  levelsMap: Record<string, Level>;
  levels: Level[];
  playlist: Playlist | null;
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const playlistLevels: PlaylistLevel[] = useMemo(() => {
    if (props.playlist) {
      return props.playlist.songs.map((song) => {
        const level = props.levelsMap[song.hash];
        if (level) {
          return {
            missing: false,
            level,
            song,
          };
        } else {
          return {
            missing: true,
            song,
          };
        }
      });
    } else {
      return props.levels.map((level) => {
        return {
          missing: false,
          level,
          song: {
            key: null,
            hash: level.hash,
            songName: level.info._songName,
          },
        };
      });
    }
  }, [props.levels, props.levelsMap, props.playlist]);
  const missingLevels = playlistLevels.filter((l) => l.missing);

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
          const level = await addLevelByHash(l.song.hash);
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

  const columns = useMemo<MRT_ColumnDef<PlaylistLevel>[]>(
    () => [
      {
        header: "Image",
        size: 50,
        accessorFn: (row) => {
          return (
            <div className="flex items-center h-full">
              {!row.missing ? (
                <img
                  src={`data:image/png;base64,${row.level.image_string}`}
                  alt={row.level.info._songName}
                  className="size-10 border-solid border"
                />
              ) : (
                <div className="size-10" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "song.songName",
        header: "Name",
      },
      {
        header: "Download",
        accessorFn: (row) => {
          return (
            row.missing && (
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
    } else {
      title = `Levels of playlist: ${props.playlist.playlistTitle}`;
    }
    return title;
  }, [props.playlist]);

  const table = useCustomizedTable({
    columns,
    data: playlistLevels,
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
