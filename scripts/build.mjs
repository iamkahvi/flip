import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

const [manifestSource = "manifest.json", outputPath = "index.html"] = process.argv.slice(2);
const templatePath = new URL("../index.template.html", import.meta.url);
const resolvedOutputPath = resolve(outputPath);
const isRemoteManifest = /^https?:\/\//i.test(manifestSource);
const supportedAssetExtensions = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

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
for (const [index, entry] of manifest.entries()) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Manifest entry ${index + 1} must be an object`);
  }
  if (typeof entry.url !== "string" || !/^https?:\/\//.test(entry.url)) {
    throw new Error(`Manifest entry ${index + 1} must have an HTTP(S) url`);
  }
  if (!supportedAssetExtensions.test(new URL(entry.url).pathname)) {
    throw new Error(`Manifest entry ${index + 1} has an unsupported image type: ${entry.url}`);
  }
  if (Object.hasOwn(entry, "caption") && typeof entry.caption !== "string") {
    throw new Error(`Caption for ${entry.url} must be a string`);
  }
}

const localManifestPath = manifestSource.startsWith("file:")
  ? fileURLToPath(manifestSource)
  : resolve(manifestSource);
const manifestUrl = isRemoteManifest
  ? manifestSource
  : relative(dirname(resolvedOutputPath), localManifestPath).replaceAll("\\", "/") || "./";
const template = await readFile(templatePath, "utf8");
const placeholder = "__MANIFEST_URL__";
if (!template.includes(placeholder)) throw new Error("Template is missing the manifest URL placeholder");

const html = template.replace(placeholder, JSON.stringify(manifestUrl));
await writeFile(resolvedOutputPath, html);
console.log(`Built ${resolvedOutputPath}; it will load ${manifestUrl} at runtime`);
