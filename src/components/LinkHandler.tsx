import { useEffect } from "react";
import { events } from "../bindings";

export function LinkHandler() {
  useEffect(() => {
    if ("initialDeepLinkId" in window) {
      const id = window.initialDeepLinkId as string;
      console.log("initial deep link event", id);
    }
    const listener = (async () => {
      return await events.deepLinkEvent.listen((e) => {
        const id = e.payload.id;
        console.log("deep link event", id);
      });
    })();
    return () => {
      (async () => {
        const unlisten = await listener;
        unlisten();
      })();
    };
  }, []);

  return <></>;
}
