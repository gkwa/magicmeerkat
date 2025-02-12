import { defineConfig } from "vite"
import { resolve } from "path"
import fs from "fs"

// Create a timestamp file during background build that both builds will use
const TIMESTAMP_FILE = resolve(__dirname, "dist/.timestamp")

function getOrCreateBuildVersion() {
  const version = JSON.parse(fs.readFileSync("./package.json", "utf-8")).version

  try {
    // Try to read existing timestamp
    const timestamp = fs.readFileSync(TIMESTAMP_FILE, "utf8")
    return `${version}-${timestamp}`
  } catch (error) {
    // If no timestamp exists, create one
    const timestamp = new Date().getTime().toString()
    fs.writeFileSync(TIMESTAMP_FILE, timestamp)
    return `${version}-${timestamp}`
  }
}

const buildVersion = getOrCreateBuildVersion()

// Get bundle filenames with version
const getBackgroundBundleName = () => `background-bundle-${buildVersion}.iife.js`
const getContentBundleName = () => `content-bundle-${buildVersion}.iife.js`

// Shared config options
const sharedConfig = {
  build: {
    minify: true,
    sourcemap: true,
    emptyOutDir: false,
  },
}

// Generate manifest plugin
const manifestPlugin = {
  name: "generate-manifest",
  writeBundle() {
    const manifest = {
      manifest_version: 3,
      name: "Page Saver MHTML",
      version: "1.0",
      description: "Save current page as MHTML with timestamp",
      permissions: [
        "pageCapture",
        "downloads",
        "tabs",
        "activeTab",
        "storage",
        "scripting",
        "commands",
      ],
      host_permissions: ["<all_urls>"],
      action: {
        default_icon: {
          16: "icon16.png",
          48: "icon48.png",
          128: "icon128.png",
        },
        default_title: "Save as MHTML",
      },
      background: {
        service_worker: getBackgroundBundleName(),
      },
      content_scripts: [
        {
          matches: ["<all_urls>"],
          js: [getContentBundleName()],
        },
      ],
      icons: {
        16: "icon16.png",
        48: "icon48.png",
        128: "icon128.png",
      },
      commands: {
        reload: {
          suggested_key: {
            default: "Ctrl+Shift+E",
            mac: "Command+Shift+E",
          },
          description: "Reload extension",
        },
        _execute_action: {
          suggested_key: {
            default: "Ctrl+Shift+S",
            mac: "Command+Shift+S",
          },
          description: "Save page as MHTML",
        },
      },
    }

    fs.writeFileSync(resolve(__dirname, "dist/manifest.json"), JSON.stringify(manifest, null, 2))
  },
}

// Cleanup plugin to remove timestamp file after both builds complete
const cleanupPlugin = {
  name: "cleanup",
  closeBundle() {
    try {
      fs.unlinkSync(TIMESTAMP_FILE)
    } catch (error) {
      // Ignore if file doesn't exist
    }
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
      fileName: () => getBackgroundBundleName(),
      formats: ["iife"],
    },
  },
  plugins: [
    {
      name: "version-inject",
      generateBundle(options, bundle) {
        const bundleFile = getBackgroundBundleName()
        if (bundle[bundleFile]) {
          bundle[bundleFile].code =
            `const BUILD_VERSION = "${buildVersion}";${bundle[bundleFile].code}`
        }
      },
    },
    manifestPlugin,
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
      fileName: () => getContentBundleName(),
      formats: ["iife"],
    },
  },
  plugins: [
    {
      name: "version-inject",
      generateBundle(options, bundle) {
        const bundleFile = getContentBundleName()
        if (bundle[bundleFile]) {
          bundle[bundleFile].code =
            `const BUILD_VERSION = "${buildVersion}";${bundle[bundleFile].code}`
        }
      },
    },
    manifestPlugin,
    cleanupPlugin,
  ],
})

export default defineConfig(({ command, mode }) => {
  console.log("Building mode:", mode)
  return mode === "background" ? backgroundConfig : contentConfig
})
