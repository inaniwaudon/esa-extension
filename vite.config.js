import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "esa-extension",
  version: "1.0",
  content_scripts: [
    {
      js: ["src/content.ts"],
      matches: ["https://inaniwa.esa.io/posts/*"],
    },
  ],
  permissions: ["storage"],
  web_accessible_resources: [
    {
      resources: ["public/*"],
      matches: ["<all_urls>"],
    },
  ],
});

export default defineConfig({
  plugins: [crx({ manifest })],
});
