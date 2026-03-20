#!/usr/bin/env bash
# build-vercel.sh — Build all ObjectQL packages for Vercel serverless deployment
#
# This script replaces the inline buildCommand in vercel.json to stay within
# Vercel's 256-character limit for that field.
#
# Steps:
#   1. Build the foundation types package first (other packages depend on it)
#   2. Patch the console plugin (dereference pnpm symlinks)
#   3. Build all remaining workspace packages
#
# Usage (called automatically by Vercel via vercel.json):
#   bash scripts/build-vercel.sh

set -euo pipefail

echo "▸ Building workspace packages..."
pnpm run build

echo "✓ Vercel build complete."
