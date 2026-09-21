# flipbook

flipbook displays the images in a manifest.

It is a static web application. It uses one HTML file and one JSON manifest file. flipbook loads the manifest when the page opens. You can change the manifest without building the HTML file again.

flipbook shows the complete image. It does not crop or resize the image.

## Requirements

flipbook requires only [Bun](https://bun.sh/). Bun builds `index.html`, runs the checks, and provides the local development server.

## Set the image list

The image list is a JSON manifest at an HTTP or HTTPS URL. This URL is the source of truth for flipbook.

The manifest can be an object containing an `images` array, as shown below, or the image array itself. An object manifest can also contain a title. flipbook uses the title for the browser page title. If the manifest has no title—or is a bare array—flipbook uses `flipbook`. Each image item must have an HTTP or HTTPS image URL. An item can also have a caption.

```json
{
  "title": "Image collection",
  "images": [
    {
      "url": "https://images.example.com/covers/image-001.jpg",
      "caption": "Caption text"
    },
    {
      "url": "https://images.example.com/image-002.png"
    }
  ]
}
```

Use only these image types:

- AVIF
- GIF
- JPEG or JPG
- PNG
- SVG
- WebP

flipbook ignores unsupported items when it loads a manifest.

In normal mode, flipbook reads captions from the manifest. It does not provide controls to change them.

## Build flipbook

`index.template.html` is the build template. Build flipbook with the manifest URL:

```sh
bun run build -- https://images.example.com/manifest.json
```

The build checks the manifest. It then writes a standalone `index.html`. The built file loads the same manifest URL at run time.

To set a different output file, run the build script directly:

```sh
bun scripts/build.mjs https://images.example.com/manifest.json dist/index.html
```

Deploy `index.html`. Keep the manifest available at its URL.

### Allow the browser to read the manifest

If `index.html` and the manifest use different origins (for example, `http://localhost:8000` and `https://cdn.example.com`), the manifest server must return a CORS header that permits the viewer to read the JSON:

```http
Access-Control-Allow-Origin: *
```

Use `*` only when the manifest is intentionally public. Alternatively, allow the specific origin where you host flipbook, such as `https://viewer.example.com`.

This permission is needed because flipbook's JavaScript reads the manifest JSON. Normal image display with `<img>` does not need CORS; browsers allow pages to display cross-origin images by default.

## Set the manifest source

flipbook selects its manifest URL in this order:

1. The `manifest` URL parameter.
2. The `flipbook:manifest-url` value in browser local storage.
3. The URL set when you build `index.html`.

For example, this URL loads another manifest:

```text
https://viewer.example/?manifest=https%3A%2F%2Fimages.example.com%2Fmanifest.json
```

To save a manifest URL in the current browser, run this command in the browser developer console. Then reload the page.

```js
localStorage.setItem("flipbook:manifest-url", "https://images.example.com/manifest.json")
```

## Run flipbook locally

Build flipbook with a manifest URL. Then start a local web server:

```sh
bun run dev
```

Open <http://localhost:8000> in a browser.

## Use flipbook

Use these controls in normal mode:

| Action | Control |
| --- | --- |
| Show the previous image | Left Arrow, `H`, or tap the left half of the screen |
| Show the next image | Right Arrow, `L`, or tap the right half of the screen |
| Show the first image | `Home` |
| Show the last image | `End` |
| Enter or leave full-screen mode | `F` |

The URL fragment identifies the current image. For example, `#3` opens the third image. You can bookmark or share this URL.

A caption appears in the bottom-left corner of the image. The caption text has a white background. Long captions wrap inside the viewport.

## Test flipbook

Run the checks:

```sh
bun run test
```
