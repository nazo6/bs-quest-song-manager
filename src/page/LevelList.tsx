import { DataTable } from "mantine-datatable";
import { UnavailableLevel } from "./Home";
import { useState } from "react";
import { Button } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import pLimit from "p-limit";
import { commands } from "../bindings";
import { Level, isSuccess } from "../typeUtils";

export function LevelList(props: {
  levels: (Level | UnavailableLevel)[];
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const { mutateAsync: addLevelByHash } = useMutation({
    mutationFn: commands.levelAddByHash,
  });
  const queryClient = useQueryClient();

  return (
    <>
      <Button
        onClick={async () => {
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
        }}
      >
        Download unavailable songs
      </Button>
      <DataTable
        rowClassName={(_, i) => {
          if (i === selectedLevel) {
            return "bg-blue-300/30";
          }
          return "";
        }}
        columns={[
          {
            accessor: "info._songName",
          },
          {
            accessor: "unavailable",
            render: (raw) => {
              if ("unavailable" in raw) {
                return (
                  <Button
                    onClick={async () => {
                      const level = await addLevelByHash(raw.hash);
                      if (isSuccess(level)) {
                        queryClient.invalidateQueries({
                          queryKey: ["levelGetAll"],
                        });
                        notifications.show({
                          title: "Added level",
                          message: `Successfully downloaded and added level. : ${level.data.info._songName}`,
                        });
                      }
                    }}
                  >
                    Download
                  </Button>
                );
              }
              return "";
            },
          },
        ]}
        records={props.levels}
        idAccessor="hash"
        onRowClick={({ index }) => {
          if (selectedLevel === index) {
            setSelectedLevel(null);
          } else {
            setSelectedLevel(index);
          }
        }}
      />
    </>
  );
}
