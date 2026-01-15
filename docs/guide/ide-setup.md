# IDE Setup

To get the best experience developing with ObjectQL, we recommend Visual Studio Code with the following configuration.

## Visual Studio Code

We recommend using [VS Code](https://code.visualstudio.com/) as your primary editor.

### Recommended Extensions

**1. YAML (Red Hat)**  
Essential for editing `*.object.yml` files. It provides syntax highlighting and validation.  
[Install Extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

**2. JSON (Official)**  
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
