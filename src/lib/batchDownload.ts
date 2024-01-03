import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isSuccess, mutation } from "../typeUtils";
import pLimit from "p-limit";
import { useState } from "react";

export const useBatchDownload = () => {
  const { mutateAsync: addLevelByHash } = useMutation(
    mutation("levelAddByHash"),
  );
  const queryClient = useQueryClient();

  const [canceled, setCanceled] = useState(false);

  const cancel = () => {
    setCanceled(true);
  };

  const dl = async (hashes: string[]) => {
    const id = notifications.show({
      title: "Downloading levels",
      message: `Downloading ${hashes.length} levels`,
      loading: true,
      autoClose: false,
    });

    let success = 0;
    let failed = 0;

    const message = () =>
      `Downloaded ${success} levels, ${failed} failed out of ${hashes.length} levels`;

    const limit = pLimit(3);
    const promises = [];
    for (const hash of hashes) {
      promises.push(
        limit(async () => {
          if (canceled) {
            return;
          }
          console.log(canceled);
          const level = await addLevelByHash(hash);
          if (!isSuccess(level)) {
            failed++;
            notifications.update({
              id,
              message: `Failed to download level : ${message()}`,
            });
            return;
          }

          queryClient.invalidateQueries({
            queryKey: ["levelGetAll"],
          });

          success++;
          notifications.update({
            id,
            title: "Added level",
            message: message(),
          });
        }),
      );
    }

    await Promise.all(promises);

    if (canceled) {
      notifications.update({
        id,
        title: "Canceled downloading",
        message: message(),
        loading: false,
        autoClose: true,
        color: "orange",
      });
    } else {
      notifications.update({
        id,
        title: "Finished downloading",
        message: message(),
        loading: false,
        autoClose: true,
      });
    }

    setCanceled(false);
  };

  return [dl, cancel] as const;
};
