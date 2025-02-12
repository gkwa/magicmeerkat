import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.js"),
        content: resolve(__dirname, "content/main.js"),
      },
      output: {
        entryFileNames: "[name]-bundle.js",
        format: "iife",
        dir: "dist",
      },
    },
    // Prevent code splitting to ensure extension compatibility
    modulePreload: false,
    cssCodeSplit: false,
  },
})
