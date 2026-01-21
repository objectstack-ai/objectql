# @objectql/runtime-core

Runtime core package for ObjectQL - Plugin system, query pipeline, and runtime orchestration.

## Features

- **PluginManager**: Dependency resolution and plugin lifecycle management
- **QueryPipeline**: Async series waterfall query processing
- **Runtime Factory**: `createRuntime()` for runtime initialization

## Installation

```bash
npm install @objectql/runtime-core @objectql/types
```

## Usage

```typescript
import { createRuntime } from '@objectql/runtime-core';
import { BasePlugin } from '@objectql/types';

// Define a plugin
const myPlugin: BasePlugin = {
  metadata: {
    name: 'my-plugin',
    version: '1.0.0',
    dependencies: []
  },
  async setup(runtime) {
    console.log('Plugin initialized');
  }
};

// Create runtime instance
const runtime = createRuntime({
  plugins: [myPlugin]
});

// Initialize
await runtime.init();

// Execute queries
const results = await runtime.query('project', {
  filters: [['status', '=', 'active']]
});
```

## License

MIT
