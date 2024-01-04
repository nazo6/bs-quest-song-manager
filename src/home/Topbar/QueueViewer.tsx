import { Popover, Tooltip, Button, Title } from "@mantine/core";
import { useDownloadQueueContext } from "../../components/DownloadQueueContext";
import { IconCloudDownload } from "@tabler/icons-react";

export function QueueViewerButton() {
  const { running, completed, waiting } = useDownloadQueueContext();

  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Tooltip label="Queue list">
          <Button
            classNames={{
              label: "flex gap-2",
            }}
            className="px-2 flex-shrink-0"
            size="xs"
          >
            <IconCloudDownload className="size-5 flex-shrink-0" />
            <p>{running.length}</p>
            <p>{waiting.length}</p>
            <p>{completed.length}</p>
          </Button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <QueueViewer
          running={running}
          completed={completed}
          waiting={waiting}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

function QueueViewer(
  props: Omit<ReturnType<typeof useDownloadQueueContext>, "queue">,
) {
  return (
    <div>
      <div>
        <Title order={4}>Running {props.running.length} items</Title>
        <div className="flex flex-col">
          {props.running.map((item) => {
            const val = "hash" in item ? item.hash : item.id;
            return <div key={val}>{val}</div>;
          })}
        </div>
      </div>
      <div>
        <Title order={4}>Waiting {props.waiting.length} items</Title>
        <div className="flex flex-col">
          {props.waiting.map((item) => {
            const val = "hash" in item ? item.hash : item.id;
            return <div key={val}>{val}</div>;
          })}
        </div>
      </div>
      <div>
        <Title order={4}>Completed {props.completed.length} items</Title>
        <div className="flex flex-col">
          {props.completed.map((item) => {
            const val =
              "hash" in item.queueItem
                ? item.queueItem.hash
                : item.queueItem.id;
            return <div key={val}>{val}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
