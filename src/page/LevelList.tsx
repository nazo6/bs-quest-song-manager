import { DataTable } from "mantine-datatable";
import { Level } from "../bindings";
import { UnavailableLevel } from "./Home";
import { useState } from "react";

export function LevelList(props: {
  levels: (Level | UnavailableLevel)[];
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  return (
    <>
      <div>playlist</div>
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
                return "unavailable";
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
