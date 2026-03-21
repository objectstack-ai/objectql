#!/usr/bin/env bash
# build-vercel.sh — Build all ObjectQL packages for Vercel serverless deployment
#
# This script is referenced by apps/demo/vercel.json and runs during the
# Vercel build step.
#
# Steps:
#   1. Build foundation packages (types → plugin-optimizations → plugins → core → platform-node)
#   2. Build drivers and protocols
#   3. Build the project-tracker showcase example
#
# Usage (called automatically by Vercel via vercel.json):
#   bash scripts/build-vercel.sh

set -euo pipefail

echo "▸ Building @objectql/types…"
pnpm --filter @objectql/types build

echo "▸ Building @objectql/plugin-optimizations…"
pnpm --filter @objectql/plugin-optimizations build

echo "▸ Building plugins…"
pnpm --filter @objectql/plugin-query \
     --filter @objectql/plugin-validator \
     --filter @objectql/plugin-formula \
     --filter @objectql/plugin-security \
     build

echo "▸ Building @objectql/core…"
pnpm --filter @objectql/core build

echo "▸ Building @objectql/platform-node…"
pnpm --filter @objectql/platform-node build

echo "▸ Building drivers…"
pnpm --filter @objectql/driver-memory \
     --filter @objectql/driver-turso \
     --filter @objectql/driver-sql \
     build

echo "▸ Building protocols…"
pnpm --filter @objectql/protocol-graphql \
     --filter @objectql/protocol-json-rpc \
     --filter @objectql/protocol-odata-v4 \
     build

echo "▸ Building project-tracker example…"
pnpm --filter @objectql/example-project-tracker build

# Ensure the output directory exists (Vercel requires it when framework=null)
mkdir -p public

echo "✓ Vercel build complete."
