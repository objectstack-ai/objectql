# Hello ObjectQL

This is the simplest possible example of **ObjectQL**.

It demonstrates:
1.  **Zero Config:** No YAML files or server setup required.
2.  **In-Memory SQL:** Uses SQLite in memory, so no database installation is needed.
3.  **Inline Schema:** Defines the data model directly in code.

## How to Run

Since you are in the monorepo, simply run:

```bash
# Install dependencies (if not already done at root)
pnpm install

# Run the script
cd examples/starters/hello-world
pnpm start
```

## What you see

The script will:
1.  Initialize the ObjectQL engine.
2.  Create a `deal` object definition on the fly.
3.  Insert a record into the in-memory SQLite database.
4.  Query it back and print the result.
