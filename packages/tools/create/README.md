# @objectql/create

The easiest way to get started with ObjectQL.

## Usage

```bash
npm create @objectql@latest
```

Follow the prompts to create your new ObjectQL application.

## Arguments

You can also pass arguments directly:

```bash
npm create @objectql@latest <project-name> --template <template-name>
```

- `<project-name>`: Name of the project directory.
- `--template`: Template to use (e.g. `hello-world` or `showcase`).

## Features

- **Embedded Templates**: No internet connection required to fetch templates.
- **Auto-Cleanup**: Automatically cleans up `package.json` configurations (strips `private: true`, resolves workspace versions).
- **Interactive**: Uses `enquirer` for a smooth interactive experience if no arguments are provided.
