import { defineConfig } from "vite"
import { resolve } from "path"

// Separate configs for background and content scripts
const backgroundConfig = defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "background.js"),
      name: "background",
      fileName: "background-bundle",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
})

const contentConfig = defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "content/main.js"),
      name: "content",
      fileName: "content-bundle",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
})

// Export based on command line argument
export default defineConfig(({ command, mode }) => {
  if (mode === "background") {
    return backgroundConfig
  }
  if (mode === "content") {
    return contentConfig
  }
  // Default to background if no mode specified
  return backgroundConfig
})
