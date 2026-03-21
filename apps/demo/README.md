# ObjectQL Demo

A standalone, deployable demo application for the ObjectQL platform.  
Runs locally with `@objectstack/cli` and deploys to **Vercel** as a serverless function.

## Features

- **In-memory driver** — zero external database required; data persists across warm Vercel invocations.
- **Console UI** — full ObjectStack Console available at `/console/`.
- **Studio UI** — ObjectStack Studio available at `/_studio/`.
- **Project-Tracker showcase** — ships with the `examples/showcase/project-tracker` metadata (objects, views, permissions) so the demo has real data structures out of the box.
- **Auth** — Better-Auth based authentication via `@objectstack/plugin-auth`.

## Local Development

```bash
# From the monorepo root:
pnpm install

# Start the demo in dev mode:
pnpm --filter @objectql/demo dev

# Or from the apps/demo directory:
cd apps/demo
pnpm dev
```

The development server starts on `http://localhost:3000`.

## Vercel Deployment

### Prerequisites

1. A [Vercel account](https://vercel.com).
2. The [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`).

### Setup

1. **Create a new Vercel project** pointing to this repository.
2. In **Project Settings → General**, set the **Root Directory** to `apps/demo`.
3. Configure the following **Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | **Yes** (production) | Secret key for signing auth tokens. Generate with `openssl rand -base64 32`. |
| `AUTH_TRUSTED_ORIGINS` | No | Comma-separated list of additional trusted origins (e.g. `https://myapp.example.com`). |

4. Deploy:

```bash
# From the monorepo root:
vercel --cwd apps/demo

# Or for production:
vercel --cwd apps/demo --prod
```

### How It Works

- **`vercel.json`** — Configures Vercel to use a custom build command, allocate 1 GiB memory to the serverless function, and rewrite all requests to the catch-all `api/[[...route]].ts` handler.
- **`api/[[...route]].ts`** — Bootstraps the full ObjectStack kernel with ObjectQL plugins, the in-memory driver, auth, Console, and Studio. Uses `@hono/node-server`'s `getRequestListener()` to bridge the Vercel serverless runtime with the Hono HTTP framework.
- **`scripts/build-vercel.sh`** — Builds all required workspace packages (foundation, drivers, plugins, protocols, examples) in the correct dependency order.
- **`scripts/patch-symlinks.cjs`** — Replaces pnpm workspace symlinks with real copies so Vercel can bundle the function without symlink errors.

### Monorepo Multi-Project

This repository contains two independent Vercel projects:

| Project | Root Directory | Framework |
|---|---|---|
| **`apps/site`** | `apps/site` | Next.js (fumadocs) |
| **`apps/demo`** | `apps/demo` | `null` (custom serverless) |

Each project is configured independently and deployed separately. Changes to one do not affect the other.

## Project Structure

```
apps/demo/
├── api/
│   └── [[...route]].ts    # Vercel serverless entry point
├── scripts/
│   ├── build-vercel.sh     # Vercel build script
│   └── patch-symlinks.cjs  # pnpm symlink dereference for Vercel
├── objectstack.config.ts   # Local dev configuration
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## Architecture

```
                     Vercel Edge Network
                            │
                            ▼
                 ┌──────────────────┐
                 │  api/[[...route]] │  ← catch-all serverless function
                 └────────┬─────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ Console  │ │ Studio │ │ REST/RPC │
        │ SPA (/)  │ │/_studio│ │ /api/*   │
        └──────────┘ └────────┘ └──────────┘
              │           │           │
              └───────────┴───────────┘
                          │
                    ObjectStack Kernel
                    (ObjectQL + Auth +
                     InMemoryDriver)
```
