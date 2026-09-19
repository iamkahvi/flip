import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

for (const marker of ["<style>", "object-fit: contain", "const assets = ["]) {
  if (!html.includes(marker)) throw new Error(`Missing ${marker} from index.html`);
}

if (html.includes('src="app.js"') || html.includes('href="styles.css"')) {
  throw new Error("index.html must not depend on external application files");
}

const match = html.match(/const assets = (\[.*?\]);\n+let currentIndex/s);
if (!match) throw new Error("Could not parse the inline asset inventory");

const assets = JSON.parse(match[1]);
if (assets.length === 0) throw new Error("The inline inventory must not be empty");

for (const url of assets) {
  const parsed = new URL(url);
  if (parsed.origin !== "https://cdn.kahvipatel.com") {
    throw new Error(`Unexpected asset origin: ${url}`);
  }
  if (!parsed.pathname.startsWith("/newsletter-assets/")) {
    throw new Error(`Asset is outside newsletter-assets: ${url}`);
  }
}

console.log(`Validated a self-contained viewer with ${assets.length} CDN image URLs.`);
