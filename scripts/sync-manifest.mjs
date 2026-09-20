import { readFile, writeFile } from "node:fs/promises";

const indexPath = new URL("../index.html", import.meta.url);
const manifestPath = new URL("../manifest.json", import.meta.url);
const html = await readFile(indexPath, "utf8");

const assetsMatch = html.match(/const assets = (\[.*?\]);\n+const captions/s);
const captionsMatch = html.match(/const captions = (\{.*?\});\n+const captionMode/s);
if (!assetsMatch || !captionsMatch) {
  throw new Error("Could not parse the inline assets and captions from index.html");
}

const assets = JSON.parse(assetsMatch[1]);
const captions = JSON.parse(captionsMatch[1]);
const manifest = assets.map((url) => {
  const entry = { url };
  if (Object.hasOwn(captions, url)) entry.caption = captions[url];
  return entry;
});

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.length} images to ${manifestPath.pathname}`);
