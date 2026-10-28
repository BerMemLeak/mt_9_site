#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Keep persistent data and backups.
docker compose down
