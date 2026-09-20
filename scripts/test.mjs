import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const sourceManifest = JSON.parse(
  await readFile(new URL("../manifest.json", import.meta.url), "utf8")
);
const template = await readFile(new URL("../index.template.html", import.meta.url), "utf8");

for (const marker of [
  "<style>",
  "object-fit: contain",
  'const defaultManifestUrl = "manifest.json"',
  "function configuredManifestUrl()",
  "function isSupportedAssetUrl(url)",
  "let assets = []",
  "fetch(manifestUrl, { cache: \"no-store\" })",
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

const manifestUrlMatch = html.match(/const defaultManifestUrl = (.*?);/);
if (!manifestUrlMatch || JSON.parse(manifestUrlMatch[1]) !== "manifest.json") {
  throw new Error("index.html must default to the local manifest.json at runtime");
}
if (!Array.isArray(sourceManifest) || sourceManifest.length === 0) {
  throw new Error("manifest.json must be a non-empty array");
}

const urls = new Set();
for (const [index, entry] of sourceManifest.entries()) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Manifest entry ${index + 1} must be an object`);
  }
  if (typeof entry.url !== "string" || urls.has(entry.url)) {
    throw new Error(`Manifest entry ${index + 1} must have a unique URL`);
  }
  const parsed = new URL(entry.url);
  if (!/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(parsed.pathname)) {
    throw new Error(`Unsupported manifest asset type: ${entry.url}`);
  }
  if (parsed.origin !== "https://cdn.kahvipatel.com") {
    throw new Error(`Unexpected asset origin: ${entry.url}`);
  }
  if (!parsed.pathname.startsWith("/newsletter-assets/")) {
    throw new Error(`Asset is outside newsletter-assets: ${entry.url}`);
  }
  if (Object.hasOwn(entry, "caption") && typeof entry.caption !== "string") {
    throw new Error(`Caption for ${entry.url} must be a string`);
  }
  urls.add(entry.url);
}

console.log(`Validated a standalone viewer configured for ${sourceManifest.length} CDN image URLs.`);
