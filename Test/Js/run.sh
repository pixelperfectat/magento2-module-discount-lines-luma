#!/bin/sh
# Runs the plain Node tests; skips (exit 0) only when node is not installed, fails (non-zero) when a test fails.
cd "$(dirname "$0")" || exit 1
if command -v node >/dev/null 2>&1; then
    exec node lines.test.js
fi
echo "node not found, JS tests skipped"
