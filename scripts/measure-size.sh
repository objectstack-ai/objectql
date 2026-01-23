#!/usr/bin/env bash
# ObjectQL Bundle Size Measurement Script
# Copyright (c) 2026-present ObjectStack Inc.
# 
# This script measures the bundle size of @objectql/core and tracks progress
# toward the target size reduction goal.
#
# Target: <400KB (gzipped)
# Current Baseline: TBD (to be established)
#
# Usage:
#   ./scripts/measure-size.sh [--json] [--compare baseline.json]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_PATH="packages/foundation/core"
TARGET_SIZE_KB=400
OUTPUT_JSON=""
COMPARE_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      OUTPUT_JSON="true"
      shift
      ;;
    --compare)
      COMPARE_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--json] [--compare baseline.json]"
      exit 1
      ;;
  esac
done

# Check if package exists
if [ ! -d "$PACKAGE_PATH" ]; then
  echo -e "${RED}Error: Package directory not found: $PACKAGE_PATH${NC}"
  exit 1
fi

# Helper function to format bytes to human-readable
format_bytes() {
  local bytes=$1
  if [ $bytes -lt 1024 ]; then
    echo "${bytes}B"
  elif [ $bytes -lt 1048576 ]; then
    echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1024}")KB"
  else
    echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1048576}")MB"
  fi
}

# Helper function to get gzipped size
get_gzipped_size() {
  local file=$1
  if [ -f "$file" ]; then
    gzip -c "$file" | wc -c
  else
    echo "0"
  fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           ObjectQL Bundle Size Measurement                ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Target Size Goal:${NC} <${TARGET_SIZE_KB}KB (gzipped)"
echo ""

# Build the package first
echo -e "${BLUE}Building package...${NC}"
cd "$PACKAGE_PATH"

if ! npm run build > /dev/null 2>&1; then
  echo -e "${RED}Build failed. Attempting with verbose output...${NC}"
  npm run build
  exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Measurements
TIMESTAMP=$(date +%s)
DATE_STRING=$(date "+%Y-%m-%d %H:%M:%S")

# Source metrics
SRC_FILES=$(find src -name "*.ts" -type f | wc -l)
SRC_LINES=$(find src -name "*.ts" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')

# Dist metrics
DIST_DIR="dist"
if [ ! -d "$DIST_DIR" ]; then
  echo -e "${RED}Error: Dist directory not found after build${NC}"
  exit 1
fi

# Calculate sizes
DIST_SIZE_RAW=$(du -sb "$DIST_DIR" | awk '{print $1}')
DIST_SIZE_HUMAN=$(du -sh "$DIST_DIR" | awk '{print $1}')

# Try to find the main bundle file
MAIN_BUNDLE=""
MAIN_BUNDLE_SIZE=0
MAIN_BUNDLE_GZIP=0

if [ -f "$DIST_DIR/index.js" ]; then
  MAIN_BUNDLE="$DIST_DIR/index.js"
  MAIN_BUNDLE_SIZE=$(wc -c < "$MAIN_BUNDLE")
  MAIN_BUNDLE_GZIP=$(get_gzipped_size "$MAIN_BUNDLE")
fi

# Count dist files
DIST_JS_FILES=$(find "$DIST_DIR" -name "*.js" -type f | wc -l)
DIST_DTS_FILES=$(find "$DIST_DIR" -name "*.d.ts" -type f | wc -l)
DIST_MAP_FILES=$(find "$DIST_DIR" -name "*.map" -type f | wc -l)

# Calculate total JS size
TOTAL_JS_SIZE=0
TOTAL_JS_GZIP=0

for jsfile in $(find "$DIST_DIR" -name "*.js" -type f); do
  FILESIZE=$(wc -c < "$jsfile")
  TOTAL_JS_SIZE=$((TOTAL_JS_SIZE + FILESIZE))
  GZIPSIZE=$(get_gzipped_size "$jsfile")
  TOTAL_JS_GZIP=$((TOTAL_JS_GZIP + GZIPSIZE))
done

TOTAL_JS_SIZE_KB=$(awk "BEGIN {printf \"%.2f\", $TOTAL_JS_GZIP/1024}")

# Display results
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Source Code Metrics${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  TypeScript Files: ${YELLOW}${SRC_FILES}${NC}"
echo -e "  Total Lines of Code: ${YELLOW}${SRC_LINES}${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Build Output Metrics${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  JavaScript Files: ${YELLOW}${DIST_JS_FILES}${NC}"
echo -e "  TypeScript Definitions: ${YELLOW}${DIST_DTS_FILES}${NC}"
echo -e "  Source Maps: ${YELLOW}${DIST_MAP_FILES}${NC}"
echo -e "  Total Dist Size: ${YELLOW}${DIST_SIZE_HUMAN}${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Bundle Size Analysis${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$MAIN_BUNDLE" ]; then
  echo -e "  Main Bundle (index.js):"
  echo -e "    Raw: ${YELLOW}$(format_bytes $MAIN_BUNDLE_SIZE)${NC}"
  echo -e "    Gzipped: ${YELLOW}$(format_bytes $MAIN_BUNDLE_GZIP)${NC}"
  echo ""
fi

echo -e "  Total JavaScript Bundle:"
echo -e "    Raw: ${YELLOW}$(format_bytes $TOTAL_JS_SIZE)${NC}"
echo -e "    Gzipped: ${YELLOW}${TOTAL_JS_SIZE_KB}KB${NC}"
echo ""

# Goal comparison
PROGRESS=$(awk "BEGIN {printf \"%.1f\", ($TOTAL_JS_GZIP/1024)/$TARGET_SIZE_KB*100}")

if (( $(awk "BEGIN {print ($TOTAL_JS_GZIP/1024) <= $TARGET_SIZE_KB}") )); then
  echo -e "  ${GREEN}✓ Target achieved!${NC} (${PROGRESS}% of target)"
else
  REMAINING=$(awk "BEGIN {printf \"%.2f\", ($TOTAL_JS_GZIP/1024) - $TARGET_SIZE_KB}")
  echo -e "  ${YELLOW}⚠ Above target${NC} by ${REMAINING}KB (${PROGRESS}% of target)"
  echo -e "  ${YELLOW}⚡ Needs reduction:${NC} ${REMAINING}KB to reach goal"
fi

echo ""

# Baseline establishment
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Baseline Information${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Measurement Date: ${YELLOW}${DATE_STRING}${NC}"
echo -e "  Package Version: ${YELLOW}$(node -p "require('./package.json').version")${NC}"
echo ""

# Comparison with previous baseline if provided
if [ -n "$COMPARE_FILE" ] && [ -f "$COMPARE_FILE" ]; then
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Comparison with Baseline${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  BASELINE_SIZE=$(jq -r '.total_js_gzip_kb' "$COMPARE_FILE")
  BASELINE_LOC=$(jq -r '.source_lines' "$COMPARE_FILE")
  
  SIZE_DIFF=$(awk "BEGIN {printf \"%.2f\", $TOTAL_JS_SIZE_KB - $BASELINE_SIZE}")
  LOC_DIFF=$((SRC_LINES - BASELINE_LOC))
  
  if (( $(awk "BEGIN {print $SIZE_DIFF < 0}") )); then
    echo -e "  ${GREEN}✓ Size reduced by ${SIZE_DIFF#-}KB${NC}"
  elif (( $(awk "BEGIN {print $SIZE_DIFF > 0}") )); then
    echo -e "  ${RED}✗ Size increased by ${SIZE_DIFF}KB${NC}"
  else
    echo -e "  ${YELLOW}= No size change${NC}"
  fi
  
  if [ $LOC_DIFF -lt 0 ]; then
    echo -e "  ${GREEN}✓ Code reduced by ${LOC_DIFF#-} lines${NC}"
  elif [ $LOC_DIFF -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ Code increased by ${LOC_DIFF} lines${NC}"
  else
    echo -e "  ${YELLOW}= No LOC change${NC}"
  fi
  echo ""
fi

# Output JSON if requested
if [ -n "$OUTPUT_JSON" ]; then
  JSON_FILE="size-baseline-$(date +%Y%m%d-%H%M%S).json"
  cat > "$JSON_FILE" <<EOF
{
  "timestamp": $TIMESTAMP,
  "date": "$DATE_STRING",
  "package": "@objectql/core",
  "version": "$(node -p "require('./package.json').version")",
  "source_files": $SRC_FILES,
  "source_lines": $SRC_LINES,
  "dist_js_files": $DIST_JS_FILES,
  "dist_dts_files": $DIST_DTS_FILES,
  "dist_size_bytes": $DIST_SIZE_RAW,
  "main_bundle_bytes": $MAIN_BUNDLE_SIZE,
  "main_bundle_gzip_bytes": $MAIN_BUNDLE_GZIP,
  "total_js_bytes": $TOTAL_JS_SIZE,
  "total_js_gzip_bytes": $TOTAL_JS_GZIP,
  "total_js_gzip_kb": $TOTAL_JS_SIZE_KB,
  "target_kb": $TARGET_SIZE_KB,
  "progress_percent": $PROGRESS
}
EOF
  echo -e "${GREEN}✓ Baseline saved to: ${JSON_FILE}${NC}"
  echo ""
fi

echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Return appropriate exit code
if (( $(awk "BEGIN {print ($TOTAL_JS_GZIP/1024) <= $TARGET_SIZE_KB}") )); then
  exit 0
else
  exit 1
fi
