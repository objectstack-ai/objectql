#!/bin/bash

# ObjectQL Studio Issues Creation Script
# This script creates GitHub issues for all Studio features
# Make sure you have GitHub CLI installed and authenticated

set -e  # Exit on error

echo "🚀 Creating ObjectQL Studio Feature Issues..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to the repository directory
cd "$(dirname "$0")"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Function to create an issue
create_issue() {
    local title="$1"
    local file="$2"
    local labels="$3"
    
    echo -e "${BLUE}Creating issue:${NC} $title"
    
    if gh issue create \
        --title "$title" \
        --body-file "$file" \
        --label "$labels"; then
        echo -e "${GREEN}✓ Created successfully${NC}"
        echo ""
    else
        echo "❌ Failed to create issue: $title"
        echo ""
        return 1
    fi
}

# Create P0 (Critical) Issues
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Creating P0 (Critical) Issues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

create_issue \
    "[Studio] Implement Full CRUD Operations" \
    "docs/issues/studio/P0-1-full-crud-operations.md" \
    "enhancement,studio,p0-critical,good-first-issue"

create_issue \
    "[Studio] Implement Record Detail View" \
    "docs/issues/studio/P0-2-record-detail-view.md" \
    "enhancement,studio,p0-critical,ui/ux"

create_issue \
    "[Studio] Implement Data Validation & Error Handling" \
    "docs/issues/studio/P0-3-data-validation-error-handling.md" \
    "enhancement,studio,p0-critical,quality,validation"

# Create P1 (High Priority) Issues
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Creating P1 (High Priority) Issues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

create_issue \
    "[Studio] Implement Advanced Schema Editor" \
    "docs/issues/studio/P1-4-advanced-schema-editor.md" \
    "enhancement,studio,p1-high,developer-experience"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All issues created successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  • P0 (Critical): 3 issues created"
echo "  • P1 (High Priority): 1 issue created"
echo "  • Total: 4 issues created"
echo ""
echo "🔗 View issues at: https://github.com/objectql/objectql/issues"
echo ""
echo "📝 Next steps:"
echo "  1. Review the created issues"
echo "  2. Add milestones if needed"
echo "  3. Assign issues to team members"
echo "  4. Set up project board"
echo "  5. Start Phase 1 implementation!"
echo ""
