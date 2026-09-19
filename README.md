# Newsletter image viewer

A single-file static viewer for every image in the R2 `newsletter-assets/` prefix.

`index.html` contains all HTML, CSS, JavaScript, and the generated list of CDN URLs. Copying that one file to any static host is sufficient to deploy it.

It displays the original CDN object without cropping or resizing. Use the left/right arrow keys to move through the images. `Home` and `End` jump to the first and last images; `F` toggles fullscreen. The current image is reflected in the URL fragment, so a view can be shared or bookmarked.

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

The command lists `r2:newsletter-bucket/newsletter-assets` and rewrites only the inline inventory in `index.html`. It accepts `R2_REMOTE`, `R2_BUCKET`, `R2_PREFIX`, and `CDN_BASE_URL` overrides.

## Verify

```sh
bun run test
```
