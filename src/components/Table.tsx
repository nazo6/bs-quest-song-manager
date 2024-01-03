import { Title } from "@mantine/core";
import clsx from "clsx";
import {
  MRT_ColumnDef,
  MRT_GlobalFilterTextInput,
  MRT_ShowHideColumnsButton,
  MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton,
  useMantineReactTable,
} from "mantine-react-table";

export type TableOpts<S, T extends Record<string, S>> = {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  selected: number | null | unknown;
  setSelected: (index: number | null) => void;
  title: string;
  customToolbar?: React.ReactNode;
};

export function useCustomizedTable<S, T extends Record<string, S>>(
  opts: TableOpts<S, T>,
) {
  const table = useMantineReactTable({
    columns: opts.columns,
    data: opts.data,
    initialState: {
      density: "xs",
      pagination: {
        pageSize: 50,
        pageIndex: 0,
      },
    },
    enableRowSelection: true,
    enableColumnOrdering: true,
    enableFullScreenToggle: false,
    enableColumnDragging: false,
    renderTopToolbarCustomActions: ({ table }) => {
      return (
        <div className="relative w-full flex flex-col">
          <div className="flex h-10">
            <Title order={4} className="mr-auto">
              {opts.title}
            </Title>
            <MRT_ToggleGlobalFilterButton table={table} />
            <MRT_ToggleFiltersButton table={table} />
            <MRT_ShowHideColumnsButton table={table} />
            <div className="[&_.mrt-global-filter-text-input]:!block">
              <MRT_GlobalFilterTextInput table={table} />
            </div>
          </div>
          <div>{opts.customToolbar}</div>
        </div>
      );
    },
    enableToolbarInternalActions: false,
    mantineSearchTextInputProps: {
      className: "hidden",
    },
    mantineTopToolbarProps: {
      className: "min-h-[unset]",
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
            staticRowIndex === opts.selected,
        }),
        onClick: () => {
          if (staticRowIndex === opts.selected) {
            opts.setSelected(null);
          } else {
            opts.setSelected(staticRowIndex);
          }
        },
      };
    },
    mantineTableBodyCellProps: {
      className: "py-1",
    },
  });

  return table;
}
