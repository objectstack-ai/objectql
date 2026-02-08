# @objectql/edge-adapter

Edge runtime adapter for ObjectQL — runtime detection, capability validation, and driver binding resolution.

## Features

### 🌐 Runtime Detection
- Automatic detection of Cloudflare Workers, Deno Deploy, Vercel Edge, Bun, and Node.js
- Inspection of global objects with ordered specificity to avoid false positives

### ✅ Capability Validation
- Validate runtime capabilities (WASM, persistent storage, WebSocket, scheduled triggers)
- Enforce minimum execution time requirements
- Pre-flight checks before driver initialization

### 🔌 Driver Binding Resolution
- Automatic driver selection per runtime (e.g., `@objectql/driver-sqlite-wasm` for Cloudflare Workers)
- Explicit binding overrides for custom datasource configurations
- Default fallback bindings when no explicit config is provided

### ⚡ Plugin Integration
- Implements `RuntimePlugin` for seamless kernel integration
- Registers edge context (runtime, capabilities, bindings) on the kernel
- Request-scoped connection support for stateless environments

## Installation

```bash
pnpm add @objectql/edge-adapter
```

## Quick Start

```typescript
import { EdgeAdapterPlugin } from '@objectql/edge-adapter';
import { createKernel } from '@objectstack/runtime';

const kernel = createKernel({
  plugins: [
    new EdgeAdapterPlugin({
      // Auto-detect runtime (or override manually)
      // runtime: 'cloudflare-workers',
      requirements: {
        wasm: true,
        persistentStorage: true,
      },
    })
  ]
});

await kernel.start();
```

## Runtime Detection

The `detectRuntime()` function inspects `globalThis` to determine the current edge runtime.

```typescript
import { detectRuntime } from '@objectql/edge-adapter';

const runtime = detectRuntime();
// => 'cloudflare-workers' | 'deno-deploy' | 'vercel-edge' | 'bun' | 'node'
```

Detection order (most specific first):

| Runtime              | Detection Signal                          |
|----------------------|-------------------------------------------|
| Cloudflare Workers   | `globalThis.caches` + `globalThis.WebSocketPair` |
| Deno Deploy          | `globalThis.Deno`                         |
| Bun                  | `globalThis.Bun`                          |
| Vercel Edge          | `globalThis.EdgeRuntime`                  |
| Node.js              | Default fallback                          |

## Capability Validation

Validate that the detected runtime meets your application requirements before initialization.

```typescript
import { detectRuntime, validateCapabilities, getCapabilities } from '@objectql/edge-adapter';

const runtime = detectRuntime();
const capabilities = getCapabilities(runtime);

console.log(capabilities);
// { wasm: true, persistentStorage: true, webSocket: true, ... }

const validation = validateCapabilities(runtime, {
  wasm: true,
  persistentStorage: true,
  minExecutionTime: 30000,
});

if (!validation.valid) {
  console.error('Missing capabilities:', validation.missing);
}
```

### CapabilityRequirement

| Property             | Type      | Description                               |
|----------------------|-----------|-------------------------------------------|
| `wasm`               | `boolean` | Requires WebAssembly support              |
| `persistentStorage`  | `boolean` | Requires persistent storage (KV, D1, etc.)|
| `webSocket`          | `boolean` | Requires WebSocket support                |
| `scheduledTriggers`  | `boolean` | Requires scheduled/cron trigger support   |
| `minExecutionTime`   | `number`  | Minimum execution time in milliseconds    |

## Driver Binding Configuration

Each runtime has a recommended default driver. You can override bindings explicitly.

```typescript
import { EdgeAdapterPlugin } from '@objectql/edge-adapter';

const plugin = new EdgeAdapterPlugin({
  runtime: 'cloudflare-workers',
  bindings: {
    default: {
      driver: '@objectql/driver-sqlite-wasm',
      binding: 'DB',
      config: { pragma: { journal_mode: 'WAL' } },
    },
    cache: {
      driver: '@objectql/driver-memory',
      config: { maxSize: 1000 },
    },
  },
});
```

### Default Driver Bindings

| Runtime              | Default Driver                  |
|----------------------|---------------------------------|
| Cloudflare Workers   | `@objectql/driver-sqlite-wasm`  |
| Deno Deploy          | `@objectql/driver-pg-wasm`      |
| Vercel Edge          | `@objectql/driver-memory`       |
| Bun                  | `@objectql/driver-sqlite-wasm`  |
| Node.js              | `@objectql/driver-sql`          |

## API Reference

### Functions

| Function               | Description                                          |
|------------------------|------------------------------------------------------|
| `detectRuntime()`      | Returns the detected `EdgeRuntime` string             |
| `getCapabilities(rt)`  | Returns the `EdgeCapabilities` for a given runtime    |
| `validateCapabilities(rt, req)` | Validates a runtime against `CapabilityRequirement` |
| `getDefaultDriver(rt)` | Returns the recommended driver package name           |
| `resolveBindings(cfg)` | Resolves `ResolvedBinding[]` from `EdgeAdapterConfig` |

### Classes

| Class                  | Description                                          |
|------------------------|------------------------------------------------------|
| `EdgeAdapterPlugin`    | `RuntimePlugin` — detects runtime, validates, binds  |

### Types

| Type                          | Description                                   |
|-------------------------------|-----------------------------------------------|
| `EdgeAdapterPluginConfig`     | Plugin constructor options                    |
| `CapabilityRequirement`       | Minimum capability requirements               |
| `CapabilityValidationResult`  | Result of `validateCapabilities()`            |
| `ResolvedBinding`             | Resolved driver binding for a datasource      |

## License

MIT
