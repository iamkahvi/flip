import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [manifestSource, outputPath = "index.html"] = process.argv.slice(2);
const templatePath = new URL("../index.template.html", import.meta.url);
const supportedAssetExtensions = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

if (!manifestSource) {
  throw new Error("Build requires an HTTP(S) manifest URL");
}

let manifestUrl;
try {
  manifestUrl = new URL(manifestSource);
} catch {
  throw new Error("Build requires a valid HTTP(S) manifest URL");
}
if (!/^https?:$/.test(manifestUrl.protocol)) {
  throw new Error("Build requires an HTTP(S) manifest URL");
}

let manifest;
try {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  manifest = await response.json();
} catch (error) {
  throw new Error(`Could not read manifest ${manifestUrl.href}: ${error.message}`);
}

if (!Array.isArray(manifest)) {
  throw new Error("Manifest must be an array of image entries");
}
for (const [index, entry] of manifest.entries()) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`Manifest entry ${index + 1} must be an object`);
  }
  if (typeof entry.url !== "string" || !/^https?:\/\//.test(entry.url)) {
    throw new Error(`Manifest entry ${index + 1} must have an HTTP(S) URL`);
  }
  if (!supportedAssetExtensions.test(new URL(entry.url).pathname)) {
    throw new Error(`Manifest entry ${index + 1} has an unsupported image type: ${entry.url}`);
  }
  if (Object.hasOwn(entry, "caption") && typeof entry.caption !== "string") {
    throw new Error(`Caption for ${entry.url} must be a string`);
  }
}

const template = await readFile(templatePath, "utf8");
const placeholder = "__MANIFEST_URL__";
if (!template.includes(placeholder)) {
  throw new Error("Template is missing the manifest URL placeholder");
}

const resolvedOutputPath = resolve(outputPath);
const html = template.replace(placeholder, JSON.stringify(manifestUrl.href));
await writeFile(resolvedOutputPath, html);
console.log(`Built ${resolvedOutputPath}; it will load ${manifestUrl.href} at runtime`);
