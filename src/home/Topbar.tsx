import { ActionIcon, Title, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFolder, IconRefresh } from "@tabler/icons-react";
import { SetRootDirModal } from "../components/SetRootDir";
import { useScanStart } from "../lib/useScanStart";
import { ThemeSelector } from "../components/ThemeSelector";

export function Topbar() {
  const [opened, { close, open }] = useDisclosure(false);

  const { scanStart } = useScanStart();

  return (
    <>
      <div className="h-11 py-2 flex items-center gap-2 bg-gray-500/20 px-2">
        <Title order={3}>BQSM</Title>
        <Tooltip label="Change root folder">
          <ActionIcon variant="filled" aria-label="Settings" onClick={open}>
            <IconFolder style={{ width: "70%", height: "70%" }} stroke={1.5} />
          </ActionIcon>
        </Tooltip>

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
        <div className="ml-auto">
          <ThemeSelector />
        </div>
      </div>

      <SetRootDirModal opened={opened} onClose={close} closeable={true} />
    </>
  );
}
