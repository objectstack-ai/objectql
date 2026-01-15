#!/bin/bash
# Setup script for automatic pnpm-lock.yaml conflict resolution
# Run this script once after cloning the repository

set -e

echo "🔧 Setting up automatic pnpm-lock.yaml conflict resolution..."

# Get the repository root directory
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Create git hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create post-merge hook to auto-run pnpm install after merges
cat > .git/hooks/post-merge << 'HOOK_EOF'
#!/bin/bash
# Auto-run pnpm install after merge if pnpm-lock.yaml was updated

# Check if pnpm-lock.yaml was modified in the merge
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "pnpm-lock.yaml"; then
    echo "📦 pnpm-lock.yaml was updated in merge, running pnpm install..."
    if command -v pnpm &> /dev/null; then
        pnpm install --no-frozen-lockfile
        echo "✅ Dependencies synchronized"
        echo "⚠️  Please review pnpm-lock.yaml and commit if needed"
    else
        echo "⚠️  pnpm not found, please run: pnpm install"
    fi
fi
HOOK_EOF

chmod +x .git/hooks/post-merge

echo "✅ Setup complete!"
echo ""
echo "ℹ️  Configuration applied:"
echo "  - pnpm-lock.yaml uses 'union' merge strategy (combines both sides)"
echo "  - post-merge hook will auto-run 'pnpm install' after merges"
echo ""
echo "ℹ️  How it works:"
echo "  1. When merging, git combines both versions of pnpm-lock.yaml"
echo "  2. After merge completes, pnpm install runs automatically to fix any issues"
echo "  3. Review and commit the updated lockfile"
echo ""
echo "⚠️  Note: Make sure to resolve any package.json conflicts manually before merging."
