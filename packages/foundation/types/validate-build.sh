#!/bin/bash

echo "======================================================================"
echo "ObjectQL Types Package - Build Validation"
echo "======================================================================"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist folder not found"
    exit 1
fi

echo "✅ dist folder exists"

# Check main files
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found"
    exit 1
fi
echo "✅ dist/index.js exists"

if [ ! -f "dist/index.d.ts" ]; then
    echo "❌ ERROR: dist/index.d.ts not found"
    exit 1
fi
echo "✅ dist/index.d.ts exists"

# Count re-exports
echo ""
echo "======================================================================"
echo "Re-export Validation"
echo "======================================================================"
reexport_count=$(grep -c "export.*from.*@objectstack" dist/index.d.ts || true)
echo "Re-exports from @objectstack: $reexport_count"

if [ "$reexport_count" -ge 6 ]; then
    echo "✅ Expected re-exports present (6+)"
else
    echo "⚠️  Warning: Expected at least 6 re-exports, found $reexport_count"
fi

# List re-exports
echo ""
echo "Re-exported types:"
grep "export.*from.*@objectstack" dist/index.d.ts | sed 's/^/  - /'

# Check query-specific types
echo ""
echo "======================================================================"
echo "Query-Specific Types Validation"
echo "======================================================================"

for type in "UnifiedQuery" "Filter" "AggregateOption" "IntrospectedTable"; do
    if grep -q "$type" dist/query.d.ts 2>/dev/null || grep -q "$type" dist/driver.d.ts 2>/dev/null; then
        echo "✅ $type found"
    else
        echo "⚠️  $type not found in expected files"
    fi
done

# Package size
echo ""
echo "======================================================================"
echo "Package Size"
echo "======================================================================"
total_size=$(du -sh dist | cut -f1)
echo "Total dist size: $total_size"

# File count
file_count=$(find dist -name "*.d.ts" | wc -l)
echo "Type definition files: $file_count"

echo ""
echo "======================================================================"
echo "Build Validation Complete ✅"
echo "======================================================================"
