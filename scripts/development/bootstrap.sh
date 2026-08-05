#!/usr/bin/env bash
# Development Environment bootstrap guide.
# HOUSEKEEPING-002 — never mutates the machine; only reports + prints hints.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════════"
echo "YourMeal OS · Development Environment Bootstrap"
echo "HOUSEKEEPING-002 · guide only (no auto-fix)"
echo "═══════════════════════════════════════════════"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is required. Install Node 20+ LTS, then re-run."
  exit 1
fi

node "$ROOT/scripts/development/index.mjs" "$@"
code=$?

echo ""
if [[ $code -eq 0 ]]; then
  echo "✅ Development Environment Ready"
  echo "Next: npm run build:mobile && npx cap sync"
else
  echo "❌ Development Environment Not Ready"
  echo "Apply the recovery hints above, open a new shell, then re-run:"
  echo "  npm run doctor:env"
  echo "  # or"
  echo "  scripts/development/bootstrap.sh"
fi

exit "$code"
