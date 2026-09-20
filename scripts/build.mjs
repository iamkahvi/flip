import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [manifestSource = "manifest.json", outputPath = "index.html"] = process.argv.slice(2);
const templatePath = new URL("../index.template.html", import.meta.url);

async function readManifest(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not fetch ${source}: ${response.status} ${response.statusText}`);
    return response.text();
  }
  if (source.startsWith("file:")) return readFile(new URL(source), "utf8");
  return readFile(resolve(source), "utf8");
}

let manifest;
try {
  manifest = JSON.parse(await readManifest(manifestSource));
} catch (error) {
  throw new Error(`Could not read manifest ${manifestSource}: ${error.message}`);
}

if (!Array.isArray(manifest)) {
  throw new Error("Manifest must be an array of image entries");
}

const urls = new Set();
for (const [index, entry] of manifest.entries()) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Manifest entry ${index + 1} must be an object`);
  }
  if (typeof entry.url !== "string" || !/^https?:\/\//.test(entry.url)) {
    throw new Error(`Manifest entry ${index + 1} must have an HTTP(S) url`);
  }
  if (urls.has(entry.url)) throw new Error(`Manifest has a duplicate URL: ${entry.url}`);
  if (Object.hasOwn(entry, "caption") && typeof entry.caption !== "string") {
    throw new Error(`Caption for ${entry.url} must be a string`);
  }
  urls.add(entry.url);
}

const template = await readFile(templatePath, "utf8");
const placeholder = "__MANIFEST__";
if (!template.includes(placeholder)) throw new Error("Template is missing the manifest placeholder");

const serializedManifest = JSON.stringify(manifest, null, 2)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");
const html = template.replace(placeholder, serializedManifest);
await writeFile(resolve(outputPath), html);
console.log(`Built ${resolve(outputPath)} with ${manifest.length} images from ${manifestSource}`);
