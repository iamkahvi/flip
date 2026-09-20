#!/usr/bin/env bash
# Refresh manifest.json from the R2 inventory while retaining existing captions.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
R2_REMOTE="${R2_REMOTE:-r2}"
R2_BUCKET="${R2_BUCKET:-newsletter-bucket}"
R2_PREFIX="${R2_PREFIX:-newsletter-assets}"
CDN_BASE_URL="${CDN_BASE_URL:-https://cdn.kahvipatel.com}"
inventory="$(mktemp)"
trap 'rm -f "$inventory"' EXIT

rclone lsf --recursive --files-only "${R2_REMOTE}:${R2_BUCKET}/${R2_PREFIX}" > "$inventory"
python3 - "$inventory" "${ROOT_DIR}/manifest.json" "$R2_PREFIX" "$CDN_BASE_URL" <<'PY'
import json
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import quote

inventory_path, manifest_path, prefix, base_url = sys.argv[1:]
image_extensions = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
try:
    previous_manifest = json.loads(Path(manifest_path).read_text())
except (OSError, json.JSONDecodeError) as error:
    raise SystemExit(f"Could not read {manifest_path}: {error}")
if not isinstance(previous_manifest, list):
    raise SystemExit("manifest.json must be an array")

captions = {
    entry["url"]: entry["caption"]
    for entry in previous_manifest
    if isinstance(entry, dict)
    and isinstance(entry.get("url"), str)
    and isinstance(entry.get("caption"), str)
}
keys = Path(inventory_path).read_text().splitlines()
manifest = []
for key in keys:
    if PurePosixPath(key).suffix.lower() not in image_extensions:
        continue
    url = f"{base_url.rstrip('/')}/{quote(prefix.strip('/') + '/' + key, safe='/')}"
    entry = {"url": url}
    if url in captions:
        entry["caption"] = captions[url]
    manifest.append(entry)

Path(manifest_path).write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
print(f"Updated {manifest_path} with {len(manifest)} image URLs")
PY
