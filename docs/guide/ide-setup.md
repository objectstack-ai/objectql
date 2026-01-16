# IDE Setup

To get the best experience developing with ObjectQL, we recommend **Visual Studio Code** equipped with the official toolset. This setup provides you with an "AI-like" development experience with intelligent auto-completion, real-time validation, and instant code generation.

## Visual Studio Code Extension

The **Standard ObjectStack AI Extension** transforms VS Code into a dedicated IDE for ObjectQL.

### Core Features

1.  **Metadata Generators** ⚡
    *   Instantly scaffold new files using the Command Palette.
    *   Supported templates: Object Definitions, Validation Rules, Permission Policies, App Configurations.
    *   *Usage:* `Cmd+Shift+P` -> Type `ObjectQL: New...`

2.  **Intelligent IntelliSense** 🧠
    *   **Schema-Aware:** The extension understands the full ObjectQL protocol (`@objectql/types`).
    *   **Auto-Completion:** Get suggestions for valid field types (`text`, `select`, `lookup`...), column options, and relationship targets.
    *   **Validation:** Real-time red-line error reporting for missing required fields or invalid types according to the strict schema.

3.  **Smart Snippets** 📝
    *   Type `oql-` to trigger a rich library of snippets.
    *   **Objects:** `oql-field-lookup`, `oql-field-select`, `oql-index`
    *   **Logic:** `oql-hook-beforeCreate`, `oql-action-record`
    *   **Validation:** `oql-validation-business`

### Installation

#### Option 1: VS Code Marketplace (Recommended)
Search for **"ObjectQL"** in the Extensions view (`Cmd+Shift+X`) and install.

#### Option 2: Install from VSIX (For Enterprise/Offline)
If you are building from source or using a private build:
1.  Run `pnpm run package` in `packages/tools/vscode-objectql`.
2.  In VS Code, run command: **"Extensions: Install from VSIX..."**
3.  Select the generated `.vsix` file.

### Recommended Usage

To maximize productivity, we recommend the following workflow:

1.  **Create an Object:**
    Run **"ObjectQL: New Object Definition"**. Enter a name (e.g., `invoice`).
    *Result:* `src/objects/invoice.object.yml` is created with standard fields definitions.

2.  **Add Fields:**
    Open the file and use Snippets.
    *   Type `oql-field-lookup` -> tab -> auto-fills a relationship field structure.
    *   Type `oql-index` -> tab -> adds a database index.

3.  **Validate:**
    The extension runs silently in the background. If you see red squiggles, hover over them to see exactly which protocol rule was violated (e.g., "Field 'required' must be a boolean").

---

## Other Essential Extensions

The ObjectQL extension automatically configures these for you, but they are worth noting:

*   **[YAML (Red Hat)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml):**
    *   *Why:* The engine behind our schema validation.
    *   *Config:* Our extension automatically injects ObjectQL schemas into this plugin's settings.

*   **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) & [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode):**
    *   *Why:* For formatting your TypeScript Logic Hooks (`*.hook.ts`).

---

## Workspace Settings

For teams working on ObjectQL projects, we recommend committing a `.vscode/extensions.json` file to suggest these tools to all developers:

```json
{
  "recommendations": [
    "objectstack-ai.vscode-objectql",
    "redhat.vscode-yaml",
    "dbaeumer.vscode-eslint"
  ]
}
```

## Git Configuration

### PNPM Lock File Merge Driver

To avoid manual merge conflicts in `pnpm-lock.yaml`, run the setup script after cloning the repository:

```bash
bash scripts/setup-merge-driver.sh
```

This configures Git to automatically regenerate the lock file when conflicts occur by running `pnpm install`.

**Manual Configuration:**

If you prefer to configure manually, run:

```bash
git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
git config merge.pnpm-merge.driver "pnpm install"
```

## AI Assistant Configuration

ObjectQL is designed to be "AI-Native". The most efficient way to write schema and hooks is by pairing with an LLM.

We strongly recommend configuring your AI Coding Assistant (GitHub Copilot, Cursor, Windsurf) with our specialized System Prompts. These prompts teach the AI about ObjectQL's metadata protocol.

[👉 Go to AI Coding Assistant Guide](../ai/coding-assistant.md)
