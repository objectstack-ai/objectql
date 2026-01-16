# Installation Guide

This guide shows how to build and install the ObjectQL VSCode extension.

## Prerequisites

- Node.js 16+ and npm
- Visual Studio Code 1.85.0 or higher
- (Optional) Red Hat YAML extension for enhanced YAML support

## Build from Source

⚠️ **Note:** This project uses `pnpm` workspaces. Ensure you are running commands from the root or using strictly `pnpm`.

1. **Navigate to the extension directory:**
```bash
cd packages/tools/vscode-objectql
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Compile TypeScript:**
```bash
pnpm run compile
```

4. **Package the extension:**
```bash
pnpm run package
```

This creates a `.vsix` file (e.g., `vscode-objectql-0.1.0.vsix`).

## Publishing (Maintainers Only)

To publish a new version to the VS Code Marketplace:

1. **Install vsce:**
```bash
pnpm add -g @vscode/vsce
```

2. **Login to Azure DevOps:**
```bash
vsce login <publisher_id>
```

3. **Publish:**
```bash
# Increment version number automatically
pnpm version patch # or minor, major

# Publish
pnpm run publish
```

## Install the Extension

### Method 1: Install from VSIX (Recommended)

1. Open Visual Studio Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Type "Extensions: Install from VSIX..."
4. Select the `vscode-objectql-0.1.0.vsix` file
5. Reload VS Code when prompted

### Method 2: Install via Command Line

```bash
code --install-extension vscode-objectql-0.1.0.vsix
```

### Method 3: Development Mode

For testing during development:

1. Open the extension folder in VS Code:
```bash
code packages/tools/vscode-objectql
```

2. Press `F5` to launch Extension Development Host
3. The extension runs in a new VS Code window for testing

## Verify Installation

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "ObjectQL" - you should see commands like:
   - ObjectQL: New Object Definition
   - ObjectQL: New Validation Rules
   - etc.

3. Create a new file with `.object.yml` extension
4. Start typing `oql-` to see snippets

## Uninstall

1. Open Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "ObjectQL"
3. Click "Uninstall"

## Troubleshooting

### Extension not activating

- Check that you have a workspace folder open
- Verify the extension is enabled in Extensions panel
- Reload VS Code: `Developer: Reload Window`

### Snippets not appearing

- Ensure you're in a YAML file
- Check that completion is enabled: `objectql.completion.enabled`
- Try reloading VS Code

### Schema validation not working

- Install Red Hat YAML extension: `redhat.vscode-yaml`
- Check settings: `objectql.validation.enabled` should be `true`
- Verify file pattern matches (e.g., `*.object.yml`)

### Build errors

- Ensure Node.js 16+ is installed
- Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read the [README](README.md) for usage examples
- Check [CONTRIBUTING](CONTRIBUTING.md) for development guidelines
- Visit [ObjectQL Documentation](https://github.com/objectstack-ai/objectql) for protocol details
