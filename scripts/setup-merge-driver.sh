#!/bin/bash

# Setup script for configuring the pnpm-lock.yaml merge driver
# This script configures Git to automatically resolve conflicts in pnpm-lock.yaml
# by regenerating the lock file using 'pnpm install'

echo "Configuring pnpm-lock.yaml merge driver..."

# Configure the merge driver
git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
git config merge.pnpm-merge.driver "pnpm install"

if [ $? -eq 0 ]; then
  echo "✓ pnpm-lock.yaml merge driver configured successfully"
  echo ""
  echo "The merge driver will automatically regenerate pnpm-lock.yaml when conflicts occur."
  echo "You can verify the configuration with: git config --get merge.pnpm-merge.driver"
else
  echo "✗ Failed to configure merge driver"
  exit 1
fi
