# flip

flip displays the images in a newsletter manifest.

It is a static web application. It uses one HTML file and one JSON manifest file. flip loads the manifest when the page opens. You can change the manifest without building the HTML file again.

flip shows the complete image. It does not crop or resize the image.

## Requirements

Use these tools to develop or update the application:

- Bun, to run the application and its tests
- Node.js, to build `index.html`
- Python 3, to run the local web server
- rclone, to update the R2 asset list

You need rclone access to the R2 bucket only when you run `sync-assets`.

## Run flip locally

Start a local web server:

```sh
bun run dev
```

Open <http://localhost:8000> in a browser.

## Use flip

Use these controls in normal mode:

| Action | Control |
| --- | --- |
| Show the previous image | Left Arrow, `H`, or tap the left half of the screen |
| Show the next image | Right Arrow, `L`, or tap the right half of the screen |
| Show the first image | `Home` |
| Show the last image | `End` |
| Enter or leave full-screen mode | `F` |

The URL fragment identifies the current image. For example, `#3` opens the third image. You can bookmark or share this URL.

## Set the image list

`manifest.json` is the default image list. The file must contain an array. Each item must have an HTTP or HTTPS image URL. An item can also have a caption.

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

Use only these image types:

- AVIF
- GIF
- JPEG or JPG
- PNG
- SVG
- WebP

The build command stops if the manifest has another image type. flip ignores unsupported items when it loads a manifest.

In normal mode, flip reads captions from the loaded manifest. It does not provide controls to change them.

## Set the manifest source

flip selects its manifest source in this order:

1. The `manifest` URL parameter.
2. The `flip:manifest-url` value in browser local storage.
3. The manifest URL set when you build `index.html`.

For example, this URL loads a manifest from another server:

```text
https://viewer.example/?manifest=https%3A%2F%2Fcdn.example%2Fmanifest.json
```

To save a manifest URL in the current browser, run this command in the browser developer console. Then reload the page.

```js
localStorage.setItem("flip:manifest-url", "https://cdn.example/manifest.json")
```

## Build flip

`index.template.html` is the build template. The build command checks the manifest, then writes a standalone `index.html`. The built file loads the manifest at run time.

Build with the local manifest:

```sh
npm run build
```

Build with another local manifest:

```sh
npm run build -- path/to/manifest.json
```

Build with a remote manifest:

```sh
npm run build -- https://example.com/manifest.json
```

To set both the manifest source and output file, run the build script directly:

```sh
node scripts/build.mjs manifest.json dist/index.html
```

Deploy the built `index.html` and its local manifest together. A remote manifest does not need to be deployed with flip.

## Edit captions

Caption mode lets you create or change captions in your browser. Open flip with `mode=caption` before the image fragment:

```text
http://localhost:8000/?mode=caption#1
```

Use these controls in caption mode:

| Action | Control |
| --- | --- |
| Edit the caption for the current image | `C` |
| Save the caption and leave the edit field | `Esc` |
| Download the current manifest and captions | `Ctrl+S` or `Cmd+S` |

flip saves edits in browser local storage. The edits stay in that browser until you remove them. They do not change the deployed manifest.

`Ctrl+S` or `Cmd+S` downloads a `manifest.json` file. Deploy this file to publish the captions. You do not need to build `index.html` again.

A caption appears in the bottom-left corner of the image. The caption text has a white background. Long captions wrap inside the viewport.

## Update the R2 asset list

Run this command after you add or remove objects in R2:

```sh
bun run sync-assets
```

The command lists files in `r2:newsletter-bucket/newsletter-assets`. It updates `manifest.json` and keeps captions for URLs that still exist. The public CDN does not list its files, so this command uses your authenticated rclone R2 remote.

You can change the R2 or CDN settings with these environment variables:

- `R2_REMOTE`
- `R2_BUCKET`
- `R2_PREFIX`
- `CDN_BASE_URL`

The deployed flip application uses the new manifest after the next page reload. You do not need to build `index.html` again.

## Test the application

Run the checks:

```sh
bun run test
```
