import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MantineProvider } from "@mantine/core";
import { createClient } from "@rspc/client";
import { TauriTransport } from "@rspc/tauri";
import { rspc } from "./rspc";
import { Procedures } from "./bindings";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";

import "@mantine/core/styles.layer.css";
import "mantine-datatable/styles.layer.css";
import "./styles.css";

export const queryClient = new QueryClient();
const client = createClient<Procedures>({
  transport: new TauriTransport(),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <rspc.Provider client={client} queryClient={queryClient}>
      <>
        <ReactQueryDevtools initialIsOpen={false} />
        <MantineProvider>
          <App />
        </MantineProvider>
      </>
    </rspc.Provider>
  </React.StrictMode>,
);
