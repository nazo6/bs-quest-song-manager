import { Title } from "@mantine/core";
import {
  MRT_ColumnDef,
  MRT_GlobalFilterTextInput,
  MRT_ShowHideColumnsButton,
  MRT_TableOptions,
  MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton,
  useMantineReactTable,
} from "mantine-react-table";

export type TableOpts<S, T extends Record<string, S>> = {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  selected?: number | null | unknown;
  setSelected?: (index: number | null) => void;
  title: string;
  customToolbar?: React.ReactNode;
  renderDetailPanel?: MRT_TableOptions<T>["renderDetailPanel"];
  mantineTableBodyRowProps?: MRT_TableOptions<T>["mantineTableBodyRowProps"];
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
    enableStickyHeader: true,
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
            {/* There are no option to hide default GlobalFilterTextInput. So, we hide it with CSS. */}
            <div className="[&_.mrt-global-filter-text-input]:!block">
              <MRT_GlobalFilterTextInput table={table} />
            </div>
          </div>
          <div>{opts.customToolbar}</div>
        </div>
      );
    },
    renderDetailPanel: opts.renderDetailPanel,
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
    mantineTableBodyRowProps: opts.mantineTableBodyRowProps,
  });

  return table;
}
