#!/usr/bin/env bash
# Inline captions from captions.json into index.html. Captions are keyed by the
# image path below newsletter-assets/ (for example, covers/102515862-cover-001.jpg).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CAPTIONS_FILE="${1:-${ROOT_DIR}/captions.json}"
INDEX_FILE="${ROOT_DIR}/index.html"

if [[ ! -f "$CAPTIONS_FILE" ]]; then
  echo "Caption source does not exist: $CAPTIONS_FILE" >&2
  exit 1
fi

python3 - "$CAPTIONS_FILE" "$INDEX_FILE" <<'PY'
import json
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlparse

captions_path, html_path = map(Path, sys.argv[1:])
try:
    source_captions = json.loads(captions_path.read_text())
except json.JSONDecodeError as error:
    raise SystemExit(f"Could not parse {captions_path}: {error}")

if not isinstance(source_captions, dict):
    raise SystemExit("Caption source must be a JSON object mapping image paths to caption text")

html = html_path.read_text()
assets_match = re.search(r"const assets = (\[.*?\]);\n+const captions", html, re.DOTALL)
if not assets_match:
    raise SystemExit("Could not parse the inline asset inventory")
assets = json.loads(assets_match.group(1))
asset_by_path = {
    unquote(urlparse(asset).path).removeprefix("/newsletter-assets/"): asset
    for asset in assets
}

embedded_captions = {}
for image_path, caption in source_captions.items():
    if not isinstance(image_path, str) or not image_path:
        raise SystemExit("Caption paths must be non-empty strings")
    if not isinstance(caption, str):
        raise SystemExit(f"Caption for {image_path!r} must be a string")

    normalized_path = str(PurePosixPath(image_path))
    if (
        image_path != normalized_path
        or normalized_path == "."
        or normalized_path.startswith("/")
        or normalized_path == ".."
        or normalized_path.startswith("../")
    ):
        raise SystemExit(f"Invalid image path: {image_path!r}")
    if normalized_path not in asset_by_path:
        raise SystemExit(f"Caption image path is not in the asset inventory: {image_path!r}")

    embedded_captions[asset_by_path[normalized_path]] = caption

replacement = f"const captions = {json.dumps(embedded_captions, ensure_ascii=False, indent=2, sort_keys=True)};"
updated_html, replacements = re.subn(
    r"const captions = \{.*?\};(?=\nconst captionMode)",
    replacement,
    html,
    count=1,
    flags=re.DOTALL,
)
if replacements != 1:
    raise SystemExit("Could not find the inline caption map")

html_path.write_text(updated_html)
print(f"Inlined {len(embedded_captions)} captions from {captions_path} into {html_path}")
PY

node "${ROOT_DIR}/scripts/sync-manifest.mjs"
