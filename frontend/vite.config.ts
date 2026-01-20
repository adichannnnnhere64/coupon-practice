import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
//

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
    ],
    base: "./", // ✅ Required for Tauri (relative paths for bundled assets)
    build: {
        outDir: "dist",
        assetsDir: "assets",
        sourcemap: true,
        target: ["es2021", "chrome100", "safari13", "firefox91"], // ✅ Tauri WebView support
        rollupOptions: {
            output: {
                manualChunks: undefined, // Single bundle for Tauri efficiency
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        host: true, // ✅ Allows Tauri to access dev server
    },
    define: {
        global: "globalThis", // ✅ Fixes Tauri global scope issues
    },
});
