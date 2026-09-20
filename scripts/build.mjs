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
  const loadedManifest = await response.json();
  manifest = Array.isArray(loadedManifest) ? { images: loadedManifest } : loadedManifest;
} catch (error) {
  throw new Error(`Could not read manifest ${manifestUrl.href}: ${error.message}`);
}

if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
  throw new Error("Manifest must be an object or an array");
}
if (Object.hasOwn(manifest, "title") && typeof manifest.title !== "string") {
  throw new Error("Manifest title must be a string");
}
if (!Array.isArray(manifest.images)) {
  throw new Error("Manifest images must be an array");
}
for (const [index, entry] of manifest.images.entries()) {
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

const template = await Bun.file(templatePath).text();
const placeholder = "__MANIFEST_URL__";
if (!template.includes(placeholder)) {
  throw new Error("Template is missing the manifest URL placeholder");
}

const html = template.replace(placeholder, JSON.stringify(manifestUrl.href));
await Bun.write(outputPath, html);
console.log(`Built ${outputPath}; it will load ${manifestUrl.href} at runtime`);
