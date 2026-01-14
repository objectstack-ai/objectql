# Browser Example for @objectql/sdk

This example demonstrates how to use `@objectql/sdk` in different environments:

- **`index.html`** - Pure browser example (no build tools)
- **`example-node.ts`** - Node.js/TypeScript example

## 🚀 Quick Start

### Prerequisites

You need a running ObjectQL server. You can start one using:

```bash
# From the repository root
cd examples/starters/hello-world
npm install
npm start
```

The server will be available at `http://localhost:3000`.

### Running the Browser Example

1. **Open the HTML file directly in a browser:**

```bash
# Open in your default browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

2. **Or serve it with a simple HTTP server:**

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

Then navigate to `http://localhost:8080` in your browser.

### Running the Node.js Example

```bash
# Install dependencies (if not already installed)
cd ../../
pnpm install

# Run the example
cd examples/browser
npx ts-node example-node.ts
```

Or compile and run:

```bash
npx tsc example-node.ts
node example-node.js
```

## 📋 Features Demonstrated

The example shows how to:

- ✅ Initialize `DataApiClient` and `MetadataApiClient` in the browser
- ✅ List records with filtering and pagination
- ✅ Get object metadata and schema
- ✅ Create new records
- ✅ Count records with filters
- ✅ Handle errors and loading states
- ✅ Works in all modern browsers (polyfill built-in!)

## 🌐 Browser Compatibility

This example works in all modern browsers:

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

**Note:** The `@objectql/sdk` package automatically includes a polyfill for `AbortSignal.timeout()`, so it works seamlessly in older browsers without any additional configuration!

## 🔧 Using in Production

For production applications, we recommend:

### Option 1: Using a Module Bundler (Recommended)

```bash
npm install @objectql/sdk @objectql/types
```

```javascript
import { DataApiClient, MetadataApiClient } from '@objectql/sdk';

const client = new DataApiClient({
    baseUrl: process.env.API_URL
});
```

### Option 2: Using ES Modules via CDN

```html
<script type="module">
    import { DataApiClient } from 'https://cdn.skypack.dev/@objectql/sdk';
    
    const client = new DataApiClient({
        baseUrl: 'https://api.example.com'
    });
</script>
```

### Option 3: Self-hosted ES Modules

After building the package, you can serve the dist files:

```html
<script type="module">
    import { DataApiClient } from '/node_modules/@objectql/sdk/dist/index.js';
    
    const client = new DataApiClient({
        baseUrl: 'http://localhost:3000'
    });
</script>
```

## 🔒 Security Considerations

When using the SDK in the browser:

1. **Never hardcode sensitive tokens** - Store them in environment variables or secure storage
2. **Use HTTPS** in production
3. **Implement CORS** properly on your ObjectQL server
4. **Validate all user input** before sending to the API
5. **Use Content Security Policy (CSP)** headers

## 📚 Additional Resources

- [ObjectQL SDK Documentation](../../packages/drivers/sdk/README.md)
- [Client SDK API Guide](../../docs/api/client-sdk.md)
- [REST API Reference](../../docs/api/rest.md)
- [ObjectQL Website](https://objectql.org)

## 🤝 Contributing

Found an issue or want to improve this example? Please open an issue or submit a PR!
