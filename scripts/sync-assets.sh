#!/usr/bin/env bash
# Refresh the inline R2 inventory in index.html. Requires the local rclone
# `r2` remote to have permission to list the configured bucket.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
R2_REMOTE="${R2_REMOTE:-r2}"
R2_BUCKET="${R2_BUCKET:-newsletter-bucket}"
R2_PREFIX="${R2_PREFIX:-newsletter-assets}"
CDN_BASE_URL="${CDN_BASE_URL:-https://cdn.kahvipatel.com}"
inventory="$(mktemp)"
trap 'rm -f "$inventory"' EXIT

rclone lsf --recursive --files-only "${R2_REMOTE}:${R2_BUCKET}/${R2_PREFIX}" > "$inventory"
python3 - "$inventory" "${ROOT_DIR}/index.html" "$R2_PREFIX" "$CDN_BASE_URL" <<'PY'
import datetime
import json
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import quote

inventory_path, html_path, prefix, base_url = sys.argv[1:]
image_extensions = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
keys = Path(inventory_path).read_text().splitlines()
assets = [
    f"{base_url.rstrip('/')}/{quote(prefix.strip('/') + '/' + key, safe='/')}"
    for key in keys
    if PurePosixPath(key).suffix.lower() in image_extensions
]
html = Path(html_path).read_text()
replacement = f"const assets = {json.dumps(assets, indent=2)};"
updated, replacements = re.subn(
    r"const assets = \[.*?\];",
    replacement,
    html,
    count=1,
    flags=re.DOTALL,
)
if replacements != 1:
    raise SystemExit("Could not find the inline asset inventory in index.html")
Path(html_path).write_text(updated)
print(f"Updated {html_path} with {len(assets)} image URLs at {datetime.datetime.now(datetime.timezone.utc).isoformat()}")
PY
