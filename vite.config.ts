import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const reactDevtoolsInject = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html: string) {
      return html.replace(
        "<!-- react-devtools -->",
        `<script src="http://localhost:8097"></script>`,
      );
    },
  };
};

export default defineConfig(async (env) => {
  return {
    plugins: [
      react(),
      env.mode === "development" ? reactDevtoolsInject() : null,
      tsconfigPaths({ root: "./" }),
    ],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
