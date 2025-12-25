import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import Icons from "unplugin-icons/vite";
import path from "node:path";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
            routesDirectory: "./routes",
            generatedRouteTree: "./routeTree.gen.ts",
        }),
        react({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
            },
        }),
        Icons({
            compiler: "jsx",
            jsx: "react",
        }),
        tailwindcss(),
    ],

    build: {
        outDir: "../dist",
        emptyOutDir: true,
    },

    resolve: {
        alias: {
            "~/features": path.resolve(__dirname, "features/"),
            "~/ui": path.resolve(__dirname, "ui/"),
            "~/hooks": path.resolve(__dirname, "hooks/"),
            "~/lib": path.resolve(__dirname, "lib/"),
            "~/providers": path.resolve(__dirname, "providers/"),
            "~": path.resolve(__dirname, "./"),
        },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell Vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    }
}));
