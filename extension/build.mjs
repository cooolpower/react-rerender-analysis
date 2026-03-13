// esbuild 기반 익스텐션 번들 빌드 스크립트
import * as esbuild from "esbuild";

const sharedOpts = {
  bundle: true,
  format: /** @type {const} */ ("esm"),
  target: "es2020",
  outdir: "dist",
};

await Promise.all([
  esbuild.build({
    ...sharedOpts,
    entryPoints: { "background/background": "background/background.ts" },
  }),
  esbuild.build({
    ...sharedOpts,
    entryPoints: { "content/content-script": "content/content-script.ts" },
    format: "iife",
  }),
  esbuild.build({
    ...sharedOpts,
    entryPoints: {
      "react-render-detector": "detector/react-render-detector.ts",
      "network-interceptor": "detector/network-interceptor.ts"
    },
    format: "iife",
  }),
  esbuild.build({
    ...sharedOpts,
    entryPoints: {
      "panel/panel": "panel/panel.ts",
      "panel/popup": "panel/popup.ts"
    },
    format: "iife",
    outdir: "dist",
  }),
]);

// Copy static files
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist/panel", { recursive: true });
await mkdir("dist/icons", { recursive: true });
await Promise.all([
  copyFile("manifest.json", "dist/manifest.json"),
  copyFile("panel/panel.html", "dist/panel/panel.html"),
  copyFile("panel/popup.html", "dist/panel/popup.html"),
  copyFile("panel/devtools.html", "dist/panel/devtools.html"),
  copyFile("icons/icon16.png", "dist/icons/icon16.png"),
  copyFile("icons/icon48.png", "dist/icons/icon48.png"),
  copyFile("icons/icon128.png", "dist/icons/icon128.png"),
]);

console.log("✅ Extension built to /extension/dist");
