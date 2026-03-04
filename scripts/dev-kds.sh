#!/usr/bin/env bash
# Wrapper for `pnpm dev:kds`.
# pnpm passes extra CLI args after a `--` separator; this script drops that
# leading `--` token and then forwards all remaining args to Vite.
# When no args are given it defaults to --host 0.0.0.0 --port 5173 so the
# dev server is reachable from the local network as well as localhost.

set -euo pipefail

# Drop a bare `--` that pnpm inserts before extra args
if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ $# -eq 0 ]]; then
  set -- --host 0.0.0.0 --port 5173
fi

exec pnpm --dir apps/kds-web exec vite "$@"
