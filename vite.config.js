import { defineConfig } from "vite"
import { resolve } from "path"

// Shared config options
const sharedConfig = {
  build: {
    minify: true,
    sourcemap: true,
    emptyOutDir: false, // Important: don't empty outDir between builds
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
}

// Background script config
const backgroundConfig = defineConfig({
  ...sharedConfig,
  build: {
    ...sharedConfig.build,
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "background.js"),
      name: "background",
      fileName: () => "background-bundle.iife.js",
      formats: ["iife"],
    },
  },
  plugins: [
    {
      name: "log-build",
      writeBundle(options, bundle) {
        console.log("Background bundle files:", Object.keys(bundle))
      },
    },
  ],
})

// Content script config
const contentConfig = defineConfig({
  ...sharedConfig,
  build: {
    ...sharedConfig.build,
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "content/main.js"),
      name: "content",
      fileName: () => "content-bundle.iife.js",
      formats: ["iife"],
    },
  },
  plugins: [
    {
      name: "log-build",
      writeBundle(options, bundle) {
        console.log("Content bundle files:", Object.keys(bundle))
      },
    },
  ],
})

export default defineConfig(({ command, mode }) => {
  console.log("Building mode:", mode)
  if (mode === "background") {
    return backgroundConfig
  }
  if (mode === "content") {
    return contentConfig
  }
  return backgroundConfig
})
