const [manifestSource, outputPath = "index.html"] = process.argv.slice(2);
const templatePath = new URL("../index.template.html", import.meta.url);
const supportedAssetExtensions = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function isSupportedAssetUrl(url) {
  try {
    return typeof url === "string" && /^https?:\/\//.test(url)
      && supportedAssetExtensions.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

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
  if (!isSupportedAssetUrl(entry.url)) {
    throw new Error(`Manifest entry ${index + 1} must have a supported HTTP(S) image URL`);
  }
  if (Object.hasOwn(entry, "caption") && typeof entry.caption !== "string") {
    throw new Error(`Caption for ${entry.url} must be a string`);
  }
  if (Object.hasOwn(entry, "preview") && !isSupportedAssetUrl(entry.preview)) {
    throw new Error(`Preview for ${entry.url} must be a supported HTTP(S) image URL`);
  }
  if (Object.hasOwn(entry, "srcset")) {
    if (!Array.isArray(entry.srcset)) {
      throw new Error(`Srcset for ${entry.url} must be an array`);
    }
    let previousWidth = 0;
    for (const candidate of entry.srcset) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)
        || !isSupportedAssetUrl(candidate.url)
        || !Number.isSafeInteger(candidate.width) || candidate.width <= previousWidth) {
        throw new Error(`Invalid srcset candidate for ${entry.url}`);
      }
      previousWidth = candidate.width;
    }
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
