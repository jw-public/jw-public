#!/usr/bin/env bash
#
# Convenience wrapper for running the packaged app locally with Docker.
#
# The image only packages a pre-built Meteor bundle, so a bare
# `docker compose up` fails (the bundle does not exist yet). This script does
# both steps: it builds src/build/src.tar.gz, then brings up app + MongoDB.
#
# Usage:
#   scripts/docker-up.sh            # build bundle + image, run in foreground
#   scripts/docker-up.sh -d         # ... detached
#   SKIP_BUILD=1 scripts/docker-up.sh   # reuse the existing bundle, just (re)start
#
# Any extra arguments are passed through to `docker compose up`.
set -euo pipefail

# Run from the repository root regardless of where the script is invoked.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

for cmd in meteor docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: '$cmd' is not installed or not on PATH." >&2
    exit 1
  fi
done

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  # `meteor build` refuses to run as root without this flag (e.g. in CI).
  BUILD_FLAGS=()
  if [ "$(id -u)" = "0" ]; then
    BUILD_FLAGS+=(--allow-superuser)
  fi

  echo "==> Building Meteor bundle (src/build/src.tar.gz)…"
  (cd src && meteor npm install && meteor build "${BUILD_FLAGS[@]}" ./build)
fi

if [ ! -f src/build/src.tar.gz ]; then
  echo "error: src/build/src.tar.gz not found — run without SKIP_BUILD first." >&2
  exit 1
fi

echo "==> Starting containers (app on http://localhost:8080)…"
exec docker compose up --build "$@"
