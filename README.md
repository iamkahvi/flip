# Newsletter image viewer

A single-file static viewer for every image in the R2 `newsletter-assets/` prefix.

`index.html` is a self-contained generated viewer. Build it from a local or remote manifest using the included template; copying the resulting one file to any static host is sufficient to deploy it.

It displays the original CDN object without cropping or resizing. Tap the left or right half of the screen to move backward or forward on touch devices; use the left/right arrow keys or `H`/`L` on a keyboard. `Home` and `End` jump to the first and last images; `F` toggles fullscreen. The current image is reflected in the URL fragment, so a view can be shared or bookmarked.

## Add a subtitle

The deployed viewer runs in **production mode** by default. Its source of truth is [`manifest.json`](manifest.json), which lists CDN image URLs and optionally their captions:

```json
[
  {
    "url": "https://cdn.kahvipatel.com/newsletter-assets/covers/102515862-cover-001.jpg",
    "caption": "Caption text"
  },
  {
    "url": "https://cdn.kahvipatel.com/newsletter-assets/102515862-img-001.png"
  }
]
```

Build a standalone `index.html` from a local manifest:

```sh
npm run build
# or: npm run build -- path/to/manifest.json
```

A manifest URL is also accepted:

```sh
npm run build -- https://example.com/manifest.json
```

Pass a second argument to write to a different output path:

```sh
node scripts/build.mjs manifest.json dist/index.html
```

Production mode has no caption-editing controls; the manifest embedded during the build is its source of truth.

### Caption mode

Open the viewer with `?mode=caption` before its image fragment—for example, `http://localhost:8000/?mode=caption#1`. Press `C` to replace the rendered caption with an inline text box in the same bottom-left position. Type a caption and press `Esc` to save it in the browser’s local storage and return to the normal caption display. Press `Ctrl+S` (or `Cmd+S`) to save the current caption and download a `manifest.json` export; replace the repository manifest with it, then run `npm run build` to publish those captions.

When present, a caption is overlaid in the image’s bottom-left corner in smaller black monospace text. Only the text itself has a white background; there is no surrounding panel or padding. Long captions wrap within the viewport.

## Run locally

```sh
bun run dev
```

Open <http://localhost:8000>.

## Refresh the inline R2 inventory

The public CDN intentionally does not provide directory listing. Regenerate the asset list from the authenticated local `rclone` R2 remote whenever objects are added or removed:

```sh
bun run sync-assets
```

The command lists `r2:newsletter-bucket/newsletter-assets`, updates `manifest.json` while retaining captions for unchanged URLs, then builds `index.html`. It accepts `R2_REMOTE`, `R2_BUCKET`, `R2_PREFIX`, and `CDN_BASE_URL` overrides.

## Verify

```sh
bun run test
```
