# Contributing to ObjectQL VSCode Extension

Thank you for your interest in contributing to the ObjectQL VSCode extension!

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/objectstack-ai/objectql.git
cd objectql/packages/tools/vscode-objectql
```

2. Install dependencies:
```bash
pnpm install
```

3. Open in VS Code:
```bash
code .
```

4. Press `F5` to launch the extension in debug mode

## Making Changes

### Adding New Snippets

Edit the snippet files in `snippets/`:
- `snippets/objectql.json` - YAML snippets for object definitions
- `snippets/hooks-actions.json` - TypeScript snippets for hooks and actions

### Updating Schemas

JSON schemas are copied from `packages/foundation/types/schemas/`. To update:

1. Make changes in the source schemas
2. Run the copy script or manually copy updated schemas

### Adding New Commands

1. Add command definition in `package.json` under `contributes.commands`
2. Register command handler in `src/extension.ts`
3. Implement command logic

### Testing

1. Press `F5` to launch Extension Development Host
2. Test your changes in the new window
3. Check for errors in the Debug Console

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add comments for complex logic
- Use English for all code and comments

## Submitting Changes

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request with clear description

## Questions?

Open an issue in the main repository for questions or discussions.
