import { useMutation } from "@tanstack/react-query";
import { RefObject, useEffect } from "react";
import { showMenu, ContextMenu } from "tauri-plugin-context-menu";
import { mutation } from "../typeUtils";

export function GlobalContextMenu() {
  const { mutateAsync: openDevtools } = useMutation(mutation("openDevtools"));

  const listener = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    showMenu({
      items: [
        {
          label: "Open Devtools",
          event: () => {
            openDevtools();
          },
        },
      ],
    });
  };

  useEffect(() => {
    window.addEventListener("contextmenu", listener);
    return () => window.removeEventListener("contextmenu", listener);
  }, [listener]);

  return <></>;
}

export function useContextMenu(
  ref: HTMLElement | null,
  menu: ContextMenu.Options,
) {
  useEffect(() => {
    const listener = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showMenu(menu);
    };
    if (!ref) return;
    ref.addEventListener("contextmenu", listener);
    return () => ref!.removeEventListener("contextmenu", listener);
  }, [ref, menu]);
}

export function useContextMenus(
  ref: RefObject<HTMLElement> | null,
  menu: ContextMenu.Options,
) {
  useEffect(() => {
    const listener = async (e: MouseEvent) => {
      e.preventDefault();
      showMenu(menu);
    };
    if (!ref || !ref.current) return;
    ref.current.addEventListener("contextmenu", listener);
    return () => ref!.current!.removeEventListener("contextmenu", listener);
  }, [ref, menu]);
}
