# @objectql/protocol-swagger-ui

Swagger UI Plugin for ObjectStack - Provides interactive API documentation and debugging interface.

## Features

- 🎨 **Interactive API Documentation** - Beautiful, user-friendly interface for exploring your API
- 🧪 **Try It Out** - Test API endpoints directly from the browser
- 📖 **Auto-Generated Docs** - Automatically syncs with your ObjectQL schema definitions
- 🔍 **Schema Explorer** - Browse data models and their relationships
- 🔐 **Authentication Support** - Built-in support for API authentication
- ⚡ **Zero Configuration** - Works out of the box with REST protocol plugin

## Installation

```bash
pnpm add @objectql/protocol-swagger-ui
```

## Quick Start

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { RestPlugin } from '@objectql/protocol-rest';
import { SwaggerUIPlugin } from '@objectql/protocol-swagger-ui';

const kernel = new ObjectStackKernel([
  // Your application config
  myAppConfig,
  
  // REST API protocol
  new RestPlugin({ basePath: '/api' }),
  
  // Swagger UI documentation
  new SwaggerUIPlugin({ 
    basePath: '/api-docs',
    title: 'My API Documentation'
  })
]);

await kernel.start();

// Access Swagger UI at: http://localhost:PORT/api-docs
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | `string` | `"/api-docs"` | Path where Swagger UI will be served |
| `specUrl` | `string` | `"/api/openapi.json"` | Path to the OpenAPI specification endpoint |
| `title` | `string` | `"ObjectQL API Documentation"` | Page title shown in browser |
| `swaggerOptions` | `object` | `{}` | Additional Swagger UI configuration options |
| `port` | `number` | `undefined` | Port for standalone server (usually not needed) |

## Advanced Configuration

### Custom Swagger UI Options

You can pass additional [Swagger UI configuration options](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/):

```typescript
new SwaggerUIPlugin({
  basePath: '/docs',
  title: 'Enterprise API',
  swaggerOptions: {
    displayOperationId: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    displayRequestDuration: true
  }
})
```

### Custom OpenAPI Spec Location

If you're using a custom REST configuration or serving the OpenAPI spec from a different location:

```typescript
new SwaggerUIPlugin({
  basePath: '/api-docs',
  specUrl: '/custom/path/to/openapi.json'
})
```

## Integration with REST Protocol

The Swagger UI plugin automatically integrates with the `@objectql/protocol-rest` plugin. Make sure the REST protocol plugin is installed and configured before the Swagger UI plugin:

```typescript
const kernel = new ObjectStackKernel([
  // 1. First, install REST protocol (provides OpenAPI spec)
  new RestPlugin({ basePath: '/api' }),
  
  // 2. Then, install Swagger UI (consumes the spec)
  new SwaggerUIPlugin({ basePath: '/api-docs' })
]);
```

## Usage

Once the server is running, navigate to the configured `basePath` in your browser (default: `http://localhost:PORT/api-docs`).

### Features Available:

1. **Explore Endpoints** - Browse all available API endpoints organized by object
2. **View Schemas** - Inspect data models and their field definitions
3. **Test APIs** - Click "Try it out" to execute requests directly from the UI
4. **View Responses** - See real-time response data and status codes
5. **Download Spec** - Download the OpenAPI specification for offline use

## Architecture

The Swagger UI plugin:

1. Serves the Swagger UI static assets from `swagger-ui-dist` package
2. Loads the OpenAPI specification from the REST protocol's `/api/openapi.json` endpoint
3. Provides an interactive HTML interface for API exploration and testing
4. Integrates seamlessly with the ObjectStack micro-kernel pattern

## Requirements

- Node.js 18+ (for ES modules support)
- `@objectql/protocol-rest` plugin must be installed and configured
- An HTTP server plugin (automatically provided by REST protocol or other protocol plugins)

## Example Projects

See the following examples for complete implementations:

- `examples/protocols/swagger-demo` - Basic Swagger UI setup
- `examples/protocols/multi-protocol-server` - Multiple protocols with documentation

## API Reference

### SwaggerUIPlugin Class

```typescript
class SwaggerUIPlugin implements RuntimePlugin {
  constructor(config?: SwaggerUIPluginConfig)
  
  // RuntimePlugin interface
  install(ctx: RuntimeContext): Promise<void>
  onStart(ctx: RuntimeContext): Promise<void>
  onStop(ctx: RuntimeContext): Promise<void>
}
```

### SwaggerUIPluginConfig Interface

```typescript
interface SwaggerUIPluginConfig {
  basePath?: string;
  specUrl?: string;
  port?: number;
  swaggerOptions?: Record<string, any>;
  title?: string;
}
```

## Troubleshooting

### Swagger UI not loading

**Symptom**: Navigating to `/api-docs` shows a blank page or error

**Solutions**:
1. Ensure the REST protocol plugin is installed and started
2. Check that the `specUrl` points to a valid OpenAPI endpoint
3. Verify the HTTP server is running and accessible

### OpenAPI spec not found

**Symptom**: Error "Failed to load API definition"

**Solutions**:
1. Confirm REST plugin is configured with correct `basePath`
2. Check the `specUrl` in SwaggerUIPlugin matches REST's OpenAPI endpoint
3. Verify the spec URL is accessible: `curl http://localhost:PORT/api/openapi.json`

### Static assets not loading

**Symptom**: CSS/JS files return 404 errors

**Solutions**:
1. Ensure `swagger-ui-dist` is installed: `pnpm install`
2. Check file permissions in `node_modules/swagger-ui-dist`

## License

MIT © 2026-present ObjectStack Inc.
