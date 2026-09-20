# Newsletter image viewer

A single-file static viewer for every image in the R2 `newsletter-assets/` prefix.

`index.html` contains all HTML, CSS, JavaScript, and the generated list of CDN URLs. Copying that one file to any static host is sufficient to deploy it.

It displays the original CDN object without cropping or resizing. Tap the left or right half of the screen to move backward or forward on touch devices; use the left/right arrow keys or `H`/`L` on a keyboard. `Home` and `End` jump to the first and last images; `F` toggles fullscreen. The current image is reflected in the URL fragment, so a view can be shared or bookmarked.

## Add a subtitle

The deployed viewer runs in **production mode** by default. Its captions are versioned in [`captions.json`](captions.json), which maps an image path below `newsletter-assets/` (for example, `covers/102515862-cover-001.jpg`) to caption text:

```json
{
  "covers/102515862-cover-001.jpg": "Caption text"
}
```

Populate or edit that file, then inline the map into `index.html`:

```sh
npm run sync-captions
```

Production mode has no caption-editing controls; the inline map is its source of truth. The generated [`manifest.json`](manifest.json) lists every CDN image as a `{ "url": "…" }` entry and includes a `caption` property only when that image has one. Both `sync-captions` and `sync-assets` regenerate the manifest.

### Caption mode

Open the viewer with `?mode=caption` before its image fragment—for example, `http://localhost:8000/?mode=caption#1`. Press `C` to replace the rendered caption with an inline text box in the same bottom-left position. Type a caption and press `Esc` to save it in the browser’s local storage and return to the normal caption display. Press `Ctrl+S` (or `Cmd+S`) to save the current caption and download a `captions.json` export; replace the repository file with it, then run `npm run sync-captions` to publish those captions.

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

The command lists `r2:newsletter-bucket/newsletter-assets`, rewrites the inline inventory in `index.html`, and regenerates `manifest.json`. It accepts `R2_REMOTE`, `R2_BUCKET`, `R2_PREFIX`, and `CDN_BASE_URL` overrides. Run `npm run sync-captions` after refreshing the inventory if the caption source references newly added images.

## Verify

```sh
bun run test
```
