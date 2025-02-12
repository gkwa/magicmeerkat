import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.js"),
        content: resolve(__dirname, "content/main.js"),
      },
      output: {
        dir: "dist",
        entryFileNames: "[name]-bundle.js",
        format: "iife",
        manualChunks: undefined,
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
    },
    modulePreload: {
      polyfill: false,
    },
    cssCodeSplit: false,
    minify: true,
    sourcemap: true,
    target: "es2015",
  },
})
