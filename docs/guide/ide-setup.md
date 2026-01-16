# IDE Setup

To get the best experience developing with ObjectQL, we recommend Visual Studio Code with the following configuration.

## Visual Studio Code

We recommend using [VS Code](https://code.visualstudio.com/) as your primary editor.

### Recommended Extensions

**1. ObjectQL Extension** ⭐  
The official ObjectQL extension provides intelligent IntelliSense, schema validation, and code snippets for all ObjectQL metadata files.

Features:
- Auto-completion for `.object.yml`, `.validation.yml`, `.permission.yml`, `.app.yml` files
- Real-time JSON Schema validation
- 30+ code snippets for common patterns
- Quick commands to create new ObjectQL files
- File icons and syntax highlighting
- TypeScript snippets for hooks and actions

**Installation:**
- From source: See `packages/tools/vscode-objectql/INSTALL.md`
- Will be available on VS Code Marketplace soon

**2. YAML (Red Hat)**  
Essential for editing `*.object.yml` files. Provides syntax highlighting and validation.  
[Install Extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

**Note:** The ObjectQL extension depends on the Red Hat YAML extension and will prompt you to install it automatically.

**3. JSON (Official)**  
For editing configuration files.

## Git Configuration

### PNPM Lock File Merge Driver

To avoid manual merge conflicts in `pnpm-lock.yaml`, run the setup script after cloning the repository:

```bash
bash scripts/setup-merge-driver.sh
```

This configures Git to automatically regenerate the lock file when conflicts occur by running `pnpm install`.

**What it does:**
- Configures a custom merge driver named "pnpm-merge"
- When `pnpm-lock.yaml` has merge conflicts, Git will automatically run `pnpm install` to regenerate it
- This eliminates the need to manually resolve lock file conflicts

**Manual Configuration:**

If you prefer to configure manually, run:

```bash
git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
git config merge.pnpm-merge.driver "pnpm install"
```

## AI Assistant Configuration

ObjectQL is designed to be "AI-Native". The most efficient way to write schema and hooks is by pairing with an LLM.

We strongly recommend configuring your AI Coding Assistant (GitHub Copilot, Cursor, Windsurf) with our specialized System Prompts. These prompts teach the AI about ObjectQL's metadata protocol.

[👉 Go to AI Coding Assistant Guide](/ai/coding-assistant)
