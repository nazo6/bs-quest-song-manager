import { Button, Tooltip } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import { SetRootDirModal } from "../../components/SetRootDir";
import { useDisclosure } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { isSuccess, query } from "../../typeUtils";
import { useMemo } from "react";

export function ChangeRootButton() {
  const [opened, { close, open }] = useDisclosure(false);
  const { data: config } = useQuery(query("configGet"));

  const dirStr = useMemo(() => {
    if (!config || !isSuccess(config)) {
      return "";
    }
    if (config.data.connection?.conn_type === "Adb") {
      return "ADB";
    }
    if (config.data.connection?.conn_type === "Local") {
      return config.data.connection?.root || "";
    }
    return "";
  }, [config]);

  return (
    <>
      <Tooltip label="Change root folder">
        <Button
          classNames={{ label: "flex gap-2" }}
          size="xs"
          onClick={open}
          className="px-2"
        >
          <IconFolder className="size-5 flex-shrink-0" />
          <p>{dirStr}</p>
        </Button>
      </Tooltip>

      <SetRootDirModal opened={opened} onClose={close} closeable={true} />
    </>
  );
}
