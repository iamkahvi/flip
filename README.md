# flip

flip displays the images in a manifest.

It is a static web application. It uses one HTML file and one JSON manifest file. flip loads the manifest when the page opens. You can change the manifest without building the HTML file again.

flip shows the complete image. It does not crop or resize the image.

## Requirements

Use these tools to develop or update flip:

- Bun, to run flip and its tests
- Node.js, to build `index.html`
- Python 3, to run the local web server

## Set the image list

The image list is a JSON manifest at an HTTP or HTTPS URL. This URL is the source of truth for flip.

The manifest must contain an array. Each item must have an HTTP or HTTPS image URL. An item can also have a caption.

```json
[
  {
    "url": "https://images.example.com/covers/image-001.jpg",
    "caption": "Caption text"
  },
  {
    "url": "https://images.example.com/image-002.png"
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

flip ignores unsupported items when it loads a manifest.

In normal mode, flip reads captions from the manifest. It does not provide controls to change them.

## Build flip

`index.template.html` is the build template. Build flip with the manifest URL:

```sh
npm run build -- https://images.example.com/manifest.json
```

The build checks the manifest. It then writes a standalone `index.html`. The built file loads the same manifest URL at run time.

To set a different output file, run the build script directly:

```sh
node scripts/build.mjs https://images.example.com/manifest.json dist/index.html
```

Deploy `index.html`. Keep the manifest available at its URL. The manifest server must allow the browser to request it from the flip origin.

## Set the manifest source

flip selects its manifest URL in this order:

1. The `manifest` URL parameter.
2. The `flip:manifest-url` value in browser local storage.
3. The URL set when you build `index.html`.

For example, this URL loads another manifest:

```text
https://viewer.example/?manifest=https%3A%2F%2Fimages.example.com%2Fmanifest.json
```

To save a manifest URL in the current browser, run this command in the browser developer console. Then reload the page.

```js
localStorage.setItem("flip:manifest-url", "https://images.example.com/manifest.json")
```

## Run flip locally

Build flip with a manifest URL. Then start a local web server:

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

flip saves edits in browser local storage. The edits stay in that browser until you remove them. They do not change the manifest URL.

`Ctrl+S` or `Cmd+S` downloads a manifest file. Publish this file at your manifest URL to publish the captions. You do not need to build `index.html` again.

A caption appears in the bottom-left corner of the image. The caption text has a white background. Long captions wrap inside the viewport.

## Test flip

Run the checks:

```sh
bun run test
```
