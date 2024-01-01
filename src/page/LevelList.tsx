import { DataTable } from "mantine-datatable";
import { Level } from "../bindings";
import { UnavailableLevel } from "./Home";
import { useState } from "react";
import { Button } from "@mantine/core";
import { rspc } from "../rspc";
import { useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import pLimit from "p-limit";

export function LevelList(props: {
  levels: (Level | UnavailableLevel)[];
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const { mutateAsync: addLevelByHash } = rspc.useMutation([
    "level.add_by_hash",
  ]);
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
                await queryClient.invalidateQueries({
                  queryKey: ["level.get_all"],
                });
                notifications.show({
                  title: "Added level",
                  message: `Successfully downloaded and added level : ${level.info._songName}`,
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
                      queryClient.invalidateQueries(["level.get_all"]);
                      notifications.show({
                        title: "Added level",
                        message: `Successfully downloaded and added level. : ${level.info._songName}`,
                      });
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
