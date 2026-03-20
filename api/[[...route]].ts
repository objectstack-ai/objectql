/**
 * Vercel Serverless Function — ObjectStack Hono Handler
 *
 * Bootstraps the full ObjectStack kernel with ObjectQL plugins,
 * using @objectstack/driver-memory for zero-config in-memory data.
 *
 * Uses `getRequestListener()` from `@hono/node-server` together with an
 * `extractBody()` helper to handle Vercel's pre-buffered request body.
 * Vercel's Node.js runtime attaches the full body to `req.rawBody` /
 * `req.body` before the handler is called, so the original stream is
 * already drained when the handler receives the request. Reading from
 * `rawBody` / `body` directly and constructing a fresh `Request` object
 * prevents POST/PUT/PATCH requests (e.g. login) from hanging indefinitely.
 *
 * Data lives in the function instance's memory and persists across
 * warm invocations (Vercel Fluid Compute) but resets on cold start.
 *
 * Both Console (/) and Studio (/_studio/) UIs are served as static SPAs.
 *
 * Timeout Protection:
 *   - Each plugin registration (kernel.use) has a 10 s timeout.
 *   - kernel.bootstrap() (init + start all plugins) has a 30 s timeout.
 *   - The entire bootstrap() function has a 50 s budget (10 s margin
 *     for Vercel's 60 s function limit).
 *   - On failure the handler returns 503 instead of hanging.
 */
import { ObjectKernel, DriverPlugin, AppPlugin, createDispatcherPlugin, createRestApiPlugin } from '@objectstack/runtime';
import { HonoHttpServer } from '@objectstack/plugin-hono-server';
import { AuthPlugin } from '@objectstack/plugin-auth';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { getRequestListener } from '@hono/node-server';
import type { Hono } from 'hono';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, statSync } from 'fs';
import { createRequire } from 'module';

// ---------------------------------------------------------------------------
// Timeout constants — protect against permanently-pending promises that would
// cause Vercel's 60 s function timeout.
// ---------------------------------------------------------------------------

/** Per-plugin kernel.use() timeout (ms). */
const PLUGIN_TIMEOUT_MS = 10_000;

/** kernel.bootstrap() (init + start all plugins) timeout (ms). */
const KERNEL_BOOTSTRAP_TIMEOUT_MS = 30_000;

/** Overall bootstrap() budget (ms). Leaves ~10 s margin for Vercel's 60 s limit. */
const BOOTSTRAP_TIMEOUT_MS = 50_000;

/**
 * Race a promise against a timer. Rejects with a descriptive error if the
 * promise does not settle within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[ObjectQL] Timeout after ${ms}ms: ${label}`));
    }, ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// ---------------------------------------------------------------------------
// Static SPA plugins — serve Console at / and Studio at /_studio/
// ---------------------------------------------------------------------------

const STUDIO_PATH = '/_studio';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function mimeType(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function resolvePackageDistPath(packageName: string): string | null {
  try {
    const req = createRequire(import.meta.url);
    const pkgPath = req.resolve(`${packageName}/package.json`);
    const distPath = join(dirname(pkgPath), 'dist');
    if (existsSync(join(distPath, 'index.html'))) return distPath;
  } catch { /* ignore */ }

  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = resolve(dirname(__filename), '..');
  const directPath = join(projectRoot, 'node_modules', ...packageName.split('/'), 'dist');
  if (existsSync(join(directPath, 'index.html'))) return directPath;

  return null;
}

function createStaticSpaPlugin(name: string, basePath: string, distPath: string, rewriteAssetPaths = true) {
  const absoluteDist = resolve(distPath);
  const indexPath = join(absoluteDist, 'index.html');
  const rawHtml = readFileSync(indexPath, 'utf-8');
  const rewrittenHtml = rewriteAssetPaths
    ? rawHtml.replace(
        /(\s(?:href|src))="(?!https?:\/\/|\/\/)\.?\/?(?!\/)/g,
        `$1="${basePath}/`,
      )
    : rawHtml;

  return {
    name,
    version: '1.0.0',
    init: async () => {},
    start: async (ctx: any) => {
      const httpServer = ctx.getService?.('http.server');
      if (!httpServer?.getRawApp) return;
      const app = httpServer.getRawApp();

      app.get(basePath, (c: any) => c.redirect(`${basePath}/`));
      app.get(`${basePath}/*`, async (c: any) => {
        const reqPath = c.req.path.substring(basePath.length) || '/';
        const filePath = resolve(absoluteDist, reqPath.replace(/^\//, ''));
        // Prevent path traversal: resolved path must stay within distPath
        if (!filePath.startsWith(absoluteDist)) {
          return c.text('Forbidden', 403);
        }
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const content = readFileSync(filePath);
          return new Response(content, {
            headers: { 'content-type': mimeType(filePath) },
          });
        }
        return new Response(rewrittenHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Body extraction helper — reads Vercel's pre-buffered request body.
// ---------------------------------------------------------------------------

/** Shape of the Vercel-augmented IncomingMessage passed via `env.incoming`. */
interface VercelIncomingMessage {
  rawBody?: Buffer | string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

/** Shape of the env object provided by `getRequestListener` on Vercel. */
interface VercelEnv {
  incoming?: VercelIncomingMessage;
}

function extractBody(incoming: VercelIncomingMessage, method: string, contentType: string | undefined): BodyInit | null {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;
  if (incoming.rawBody != null) {
    if (typeof incoming.rawBody === 'string') return incoming.rawBody;
    return incoming.rawBody;
  }
  if (incoming.body != null) {
    if (typeof incoming.body === 'string') return incoming.body;
    if (contentType?.includes('application/json')) return JSON.stringify(incoming.body);
    return String(incoming.body);
  }
  return null;
}

/**
 * Derive the correct public URL for the request, fixing the protocol when
 * running behind a reverse proxy such as Vercel's edge network.
 */
function resolvePublicUrl(requestUrl: string, incoming: VercelIncomingMessage | undefined): string {
  if (!incoming) return requestUrl;
  const fwdProto = incoming.headers?.['x-forwarded-proto'];
  const rawProto = Array.isArray(fwdProto) ? fwdProto[0] : fwdProto;
  const proto = rawProto === 'https' || rawProto === 'http' ? rawProto : undefined;
  if (proto === 'https' && requestUrl.startsWith('http:')) {
    return requestUrl.replace(/^http:/, 'https:');
  }
  return requestUrl;
}

// ---------------------------------------------------------------------------
// Singleton bootstrap — runs eagerly at module load, reused across warm
// invocations (Vercel Fluid Compute).
// ---------------------------------------------------------------------------

const bootstrapPromise: Promise<Hono> = withTimeout(
  bootstrap(),
  BOOTSTRAP_TIMEOUT_MS,
  'Overall bootstrap',
).catch((err) => {
  console.error('[ObjectQL] Bootstrap failed:', err);
  throw err;
});

// ---------------------------------------------------------------------------
// Vercel Node.js serverless handler via @hono/node-server getRequestListener.
// ---------------------------------------------------------------------------

export default getRequestListener(async (request, env) => {
  let app: Hono;
  try {
    app = await bootstrapPromise;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ObjectQL] Handler error — bootstrap did not complete:', message);
    return new Response(
      JSON.stringify({ error: 'Service Unavailable', message: 'Kernel bootstrap failed. Check function logs for details.' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  const method = request.method.toUpperCase();
  const incoming = (env as VercelEnv)?.incoming;

  // Fix URL protocol using x-forwarded-proto (Vercel sets this to 'https').
  const url = resolvePublicUrl(request.url, incoming);

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && incoming) {
    const contentType = incoming.headers?.['content-type'];
    const contentTypeStr = Array.isArray(contentType) ? contentType[0] : contentType;
    const body = extractBody(incoming, method, contentTypeStr);
    if (body != null) {
      return await app.fetch(new Request(url, { method, headers: request.headers, body }));
    }
  }

  // For GET/HEAD/OPTIONS (or body-less requests): pass through with corrected URL.
  return await app.fetch(
    url !== request.url
      ? new Request(url, { method, headers: request.headers })
      : request,
  );
});

// ---------------------------------------------------------------------------
// Bootstrap — creates the full ObjectStack kernel with all plugins
// ---------------------------------------------------------------------------

async function bootstrap(): Promise<Hono> {
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;
  const log = (msg: string) => console.log(`[ObjectQL] [${elapsed()}] ${msg}`);

  log('Bootstrap starting…');

  const kernel = new ObjectKernel();

  // 1. ObjectQL engine (provides metadata, data, and protocol services)
  log('Registering ObjectQLPlugin…');
  await withTimeout(kernel.use(new ObjectQLPlugin()), PLUGIN_TIMEOUT_MS, 'ObjectQLPlugin');
  log('ObjectQLPlugin registered.');

  // 2. In-memory data driver (no external DB required)
  log('Registering DriverPlugin (InMemoryDriver)…');
  await withTimeout(kernel.use(new DriverPlugin(new InMemoryDriver(), 'memory')), PLUGIN_TIMEOUT_MS, 'DriverPlugin');
  log('DriverPlugin registered.');

  // 3. HTTP server adapter — register the Hono app without TCP listener
  const httpServer = new HonoHttpServer();
  log('Registering vercel-http…');
  await withTimeout(kernel.use({
    name: 'vercel-http',
    version: '1.0.0',
    init: async (ctx: any) => {
      ctx.registerService('http.server', httpServer);
      ctx.registerService('http-server', httpServer);
    },
    start: async () => {},
  }), PLUGIN_TIMEOUT_MS, 'vercel-http');
  log('vercel-http registered.');

  // 4. In-memory cache service (satisfies the 'cache' core service requirement)
  log('Registering cache service…');
  await withTimeout(kernel.use({
    name: 'com.objectql.cache.memory',
    version: '1.0.0',
    init: async (ctx: any) => {
      const store = new Map<string, { value: unknown; expiresAt: number | null }>();
      const isExpired = (entry: { expiresAt: number | null }) =>
        entry.expiresAt !== null && Date.now() > entry.expiresAt;
      ctx.registerService('cache', {
        async get(key: string) {
          const entry = store.get(key);
          if (!entry) return undefined;
          if (isExpired(entry)) {
            store.delete(key);
            return undefined;
          }
          return entry.value;
        },
        async set(key: string, value: unknown, ttl?: number) {
          store.set(key, {
            value,
            expiresAt: ttl ? Date.now() + ttl * 1000 : null,
          });
        },
        async del(key: string) {
          store.delete(key);
        },
        async clear() {
          store.clear();
        },
        async has(key: string) {
          const entry = store.get(key);
          if (!entry) return false;
          if (isExpired(entry)) {
            store.delete(key);
            return false;
          }
          return true;
        },
      });
    },
    start: async () => {},
  }), PLUGIN_TIMEOUT_MS, 'cache-memory');
  log('Cache service registered.');

  // 5. Authentication & Identity (better-auth based)
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret && process.env.VERCEL) {
    throw new Error(
      '[ObjectQL] AUTH_SECRET environment variable is required on Vercel. ' +
      'Set it in the Vercel Dashboard → Project Settings → Environment Variables.',
    );
  }

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

  log('Registering AuthPlugin…');
  await withTimeout(kernel.use(new AuthPlugin({
    secret: authSecret || 'objectql-dev-secret-change-me-in-production',
    baseUrl,
    trustedOrigins: [
      'http://localhost:*',
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
      ...(process.env.AUTH_TRUSTED_ORIGINS ? process.env.AUTH_TRUSTED_ORIGINS.split(',').map(s => s.trim()) : []),
    ],
  })), PLUGIN_TIMEOUT_MS, 'AuthPlugin');
  log('AuthPlugin registered.');

  // 6. Application config (metadata)
  log('Registering AppPlugin (manifest)…');
  await withTimeout(kernel.use(new AppPlugin({
    manifest: {
      id: 'com.objectql.app',
      namespace: 'objectql',
      version: '1.0.0',
      type: 'app',
      name: 'ObjectQL Platform',
    },
    objects: [],
    plugins: [],
  })), PLUGIN_TIMEOUT_MS, 'AppPlugin-manifest');
  log('AppPlugin (manifest) registered.');

  // 7. REST API endpoints (auto-generated CRUD for all objects)
  log('Registering RestApiPlugin…');
  await withTimeout(kernel.use(createRestApiPlugin()), PLUGIN_TIMEOUT_MS, 'RestApiPlugin');
  log('RestApiPlugin registered.');

  // 8. Dispatcher (auth, graphql, analytics routes)
  log('Registering DispatcherPlugin…');
  await withTimeout(kernel.use(createDispatcherPlugin()), PLUGIN_TIMEOUT_MS, 'DispatcherPlugin');
  log('DispatcherPlugin registered.');

  // 9. Console UI (serves the ObjectStack Console SPA at /console/)
  const consoleDistPath = resolvePackageDistPath('@object-ui/console');
  if (consoleDistPath) {
    log('Registering Console SPA static plugin…');
    await withTimeout(
      kernel.use(createStaticSpaPlugin('com.objectui.console-static', '/console', consoleDistPath, false)),
      PLUGIN_TIMEOUT_MS,
      'Console-SPA',
    );
    const app = httpServer.getRawApp();
    app.get('/', (c: any) => c.redirect('/console/'));
    log('Console SPA registered.');
  }

  // 10. Studio UI (serves the ObjectStack Studio SPA at /_studio/)
  const studioDistPath = resolvePackageDistPath('@objectstack/studio');
  if (studioDistPath) {
    log('Registering Studio SPA static plugin…');
    await withTimeout(
      kernel.use(createStaticSpaPlugin('com.objectstack.studio-static', STUDIO_PATH, studioDistPath)),
      PLUGIN_TIMEOUT_MS,
      'Studio-SPA',
    );
    log('Studio SPA registered.');
  }

  // 11. Bootstrap kernel (init + start all plugins, fire kernel:ready)
  log('Running kernel.bootstrap()…');
  await withTimeout(kernel.bootstrap(), KERNEL_BOOTSTRAP_TIMEOUT_MS, 'kernel.bootstrap()');
  log(`Bootstrap complete in ${elapsed()}.`);

  return httpServer.getRawApp();
}
