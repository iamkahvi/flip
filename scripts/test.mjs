import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const template = await readFile(new URL("../index.template.html", import.meta.url), "utf8");
const build = await readFile(new URL("./build.mjs", import.meta.url), "utf8");

for (const marker of [
  "<style>",
  "object-fit: contain",
  "const defaultManifestUrl = null",
  "function configuredManifestUrl()",
  "function isSupportedAssetUrl(url)",
  "let assets = []",
  'fetch(manifestUrl, { cache: "no-store" })',
  'throw new Error("Set an HTTP(S) manifest URL")',
  "const captionMode = new URLSearchParams",
  "const localCaptions = captionMode ? loadCaptions() : {}",
  "let isEditingCaption = false",
  'class="caption-input" aria-label="Subtitle for this image" hidden',
  "captionInput.hidden = !captionMode || !isEditingCaption",
  ".caption-input[hidden]",
  "function startCaptionEditing()",
  "function saveCurrentCaption()",
  'event.key.toLowerCase() === "h"',
  'event.key.toLowerCase() === "l"',
  'viewer.addEventListener("pointerdown"',
  "event.clientX < window.innerWidth / 2",
  'download.download = "manifest.json"',
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
if (html.includes("caption-button") || html.includes("caption-export") || html.includes("caption-editor")) {
  throw new Error("Caption mode must use only the inline text box");
}

for (const marker of [
  "Build requires an HTTP(S) manifest URL",
  "const response = await fetch(manifestUrl)",
  "manifestUrl.href"
]) {
  if (!build.includes(marker)) throw new Error(`Missing ${marker} from scripts/build.mjs`);
}

const captionStyles = html.match(/\.caption \{(.*?)\n\}/s)?.[1];
const captionTextStyles = html.match(/\.caption-text \{(.*?)\n\}/s)?.[1];
const captionInputStyles = html.match(/\.caption-input \{(.*?)\n\}/s)?.[1];
if (!captionStyles || !captionTextStyles || !captionInputStyles) {
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
for (const marker of ["padding: 0", "background: #fff", "field-sizing: content"]) {
  if (!captionInputStyles.includes(marker)) {
    throw new Error(`Caption input must match the rendered caption: ${marker}`);
  }
}

console.log("Validated the standalone flip viewer and its remote-manifest build configuration.");
