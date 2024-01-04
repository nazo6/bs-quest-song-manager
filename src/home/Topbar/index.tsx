import { ActionIcon, Title, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useScanStart } from "../../lib/useScanStart";
import { ThemeSelector } from "./ThemeSelector";
import { QueueViewerButton } from "./QueueViewer";
import { ChangeRootButton } from "./ChangeRootButton";

export function Topbar() {
  const { scanStart } = useScanStart();

  return (
    <>
      <div className="h-11 py-2 flex items-center gap-2 bg-gray-500/20 px-2">
        <Title order={3}>BQSM</Title>

        <ChangeRootButton />

        <Tooltip label="Scan">
          <ActionIcon
            variant="filled"
            aria-label="Settings"
            onClick={() => {
              scanStart();
            }}
          >
            <IconRefresh style={{ width: "70%", height: "70%" }} stroke={1.5} />
          </ActionIcon>
        </Tooltip>

        <QueueViewerButton />

        <div className="ml-auto">
          <ThemeSelector />
        </div>
      </div>
    </>
  );
}
