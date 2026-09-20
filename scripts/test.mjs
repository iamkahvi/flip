import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

for (const marker of [
  "<style>",
  "object-fit: contain",
  "const assets = [",
  "const captions = {",
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
  'download.download = "captions.json"',
  ".caption[hidden]",
  "font-size: clamp(1rem, 2vw, 1.75rem)",
  "font-family: monospace",
  "captionText.textContent = text"
]) {
  if (!html.includes(marker)) throw new Error(`Missing ${marker} from index.html`);
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

const match = html.match(/const assets = (\[.*?\]);\n+const captions/s);
if (!match) throw new Error("Could not parse the inline asset inventory");
const captionsMatch = html.match(/const captions = (\{.*?\});\n+const captionMode/s);
if (!captionsMatch) throw new Error("Could not parse the inline caption map");

const assets = JSON.parse(match[1]);
const captions = JSON.parse(captionsMatch[1]);
const sourceCaptions = JSON.parse(
  await readFile(new URL("../captions.json", import.meta.url), "utf8")
);
const manifest = JSON.parse(
  await readFile(new URL("../manifest.json", import.meta.url), "utf8")
);
if (!sourceCaptions || typeof sourceCaptions !== "object" || Array.isArray(sourceCaptions)) {
  throw new Error("captions.json must be an object mapping image paths to caption text");
}
if (assets.length === 0) throw new Error("The inline inventory must not be empty");

const assetPaths = new Map();
for (const url of assets) {
  const parsed = new URL(url);
  if (parsed.origin !== "https://cdn.kahvipatel.com") {
    throw new Error(`Unexpected asset origin: ${url}`);
  }
  if (!parsed.pathname.startsWith("/newsletter-assets/")) {
    throw new Error(`Asset is outside newsletter-assets: ${url}`);
  }
  assetPaths.set(decodeURIComponent(parsed.pathname.slice("/newsletter-assets/".length)), url);
}

if (Object.keys(captions).length !== Object.keys(sourceCaptions).length) {
  throw new Error("Inline captions do not match captions.json");
}
for (const [imagePath, caption] of Object.entries(sourceCaptions)) {
  const assetUrl = assetPaths.get(imagePath);
  if (!assetUrl) throw new Error(`Caption source references an unknown image: ${imagePath}`);
  if (typeof caption !== "string" || captions[assetUrl] !== caption) {
    throw new Error(`Inline caption does not match the source for: ${imagePath}`);
  }
}
for (const [assetUrl, caption] of Object.entries(captions)) {
  if (!assets.includes(assetUrl) || typeof caption !== "string") {
    throw new Error(`Invalid inline caption: ${assetUrl}`);
  }
}

if (!Array.isArray(manifest) || manifest.length !== assets.length) {
  throw new Error("manifest.json must contain every image in the inline inventory");
}
for (const [index, assetUrl] of assets.entries()) {
  const entry = manifest[index];
  if (!entry || entry.url !== assetUrl) {
    throw new Error(`Manifest URL does not match image ${index + 1}`);
  }
  if (Object.hasOwn(captions, assetUrl)) {
    if (entry.caption !== captions[assetUrl]) {
      throw new Error(`Manifest caption does not match image ${index + 1}`);
    }
  } else if (Object.hasOwn(entry, "caption")) {
    throw new Error(`Manifest has an unexpected caption for image ${index + 1}`);
  }
}

console.log(`Validated a self-contained viewer with ${assets.length} CDN image URLs and ${Object.keys(captions).length} captions.`);
