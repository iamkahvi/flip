import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const template = await readFile(new URL("../index.template.html", import.meta.url), "utf8");
const build = await readFile(new URL("./build.mjs", import.meta.url), "utf8");

for (const marker of [
  "<style>",
  "<title>flipbook</title>",
  "object-fit: contain",
  "const defaultManifestUrl = null",
  "const defaultPageTitle = \"flipbook\"",
  "let manifestTitle = defaultPageTitle;",
  "function configuredManifestUrl()",
  "function isSupportedAssetUrl(url)",
  "let assets = []",
  'fetch(manifestUrl, { cache: "no-store" })',
  'throw new Error("Set an HTTP(S) manifest URL")',
  'throw new Error("Manifest title must be a string")',
  "for (const [index, entry] of manifest.images.entries())",
  "document.title = manifestTitle;",
  'event.key.toLowerCase() === "h"',
  'event.key.toLowerCase() === "l"',
  'viewer.addEventListener("pointerdown"',
  "event.clientX < window.innerWidth / 2",
  ".caption[hidden]",
  "font-size: clamp(1rem, 2vw, 1.75rem)",
  "font-family: monospace",
  "captionText.textContent = text"
]) {
  if (!html.includes(marker)) throw new Error(`Missing ${marker} from index.html`);
}

if (!template.includes("__MANIFEST_URL__")) {
  throw new Error("index.template.html must include the manifest URL placeholder");
}
if (html.includes('src="app.js"') || html.includes('href="styles.css"')) {
  throw new Error("index.html must not depend on external application files");
}
for (const marker of ["caption-input", "captionMode", "localCaptions", "exportManifest"]) {
  if (html.includes(marker)) throw new Error(`Caption editing code must not include ${marker}`);
}

for (const marker of [
  "Build requires an HTTP(S) manifest URL",
  'throw new Error("Manifest title must be a string")',
  "for (const [index, entry] of manifest.images.entries())",
  "const response = await fetch(manifestUrl)",
  "manifestUrl.href"
]) {
  if (!build.includes(marker)) throw new Error(`Missing ${marker} from scripts/build.mjs`);
}

const captionStyles = html.match(/\.caption \{(.*?)\n\}/s)?.[1];
const captionTextStyles = html.match(/\.caption-text \{(.*?)\n\}/s)?.[1];
if (!captionStyles || !captionTextStyles) {
  throw new Error("Could not find caption styles");
}
for (const marker of ["position: absolute", "bottom: 0", "left: 0", "width: fit-content"]) {
  if (!captionStyles.includes(marker)) {
    throw new Error(`Caption must be overlaid in the bottom-left corner: ${marker}`);
  }
}
if (captionStyles.includes("padding")) {
  throw new Error("The caption container must not add padding around the text");
}
for (const marker of ["display: inline", "background: #fff"]) {
  if (!captionTextStyles.includes(marker)) {
    throw new Error(`Caption text must supply its own white background: ${marker}`);
  }
}
console.log("Validated the standalone flip viewer and its remote-manifest build configuration.");
