#!/usr/bin/env node
/**
 * patch-symlinks.cjs
 *
 * Prepares node_modules for Vercel deployment.
 *
 * pnpm uses symlinks in node_modules which Vercel rejects as
 * "invalid deployment package … symlinked directories". This script:
 *
 *   1. Resolves transitive dependencies — walks each package's pnpm
 *      virtual store context (`.pnpm/<name>@<ver>/node_modules/`) and
 *      copies any missing dependency into the top-level `node_modules/`.
 *      This is repeated until the full transitive closure is present.
 *
 *   2. Dereferences all remaining symlinks — replaces every top-level
 *      symlink in `node_modules/` with a real copy so Vercel can bundle
 *      the serverless function.
 *
 * This script is invoked explicitly from build-vercel.sh before any build
 * steps run, ensuring all transitive dependencies are present and all pnpm
 * symlinks are replaced with real copies before Vercel bundles the function.
 * It can also be run manually for local testing of Vercel-like environments.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * List all top-level package names in a node_modules directory.
 * Handles scoped packages (@scope/name).
 */
function listTopLevelPackages(nmAbs) {
    const packages = [];
    if (!fs.existsSync(nmAbs)) return packages;

    for (const entry of fs.readdirSync(nmAbs)) {
        if (entry === '.pnpm' || entry.startsWith('.')) continue;

        const entryPath = path.join(nmAbs, entry);

        if (entry.startsWith('@')) {
            try {
                if (!fs.statSync(entryPath).isDirectory()) continue;
            } catch { continue; }
            for (const sub of fs.readdirSync(entryPath)) {
                packages.push(`${entry}/${sub}`);
            }
        } else {
            packages.push(entry);
        }
    }
    return packages;
}

/**
 * Given a resolved real path of a package *inside* the pnpm virtual store,
 * return the virtual `node_modules/` directory that contains the package's
 * dependencies as siblings.
 *
 * Example:
 *   realPath = …/.pnpm/@objectstack+runtime@3.2.8/node_modules/@objectstack/runtime
 *   pkgName  = @objectstack/runtime          (2 segments)
 *   → …/.pnpm/@objectstack+runtime@3.2.8/node_modules
 */
function pnpmContextDir(realPath, pkgName) {
    const depth = pkgName.split('/').length; // 1 for unscoped, 2 for scoped
    let dir = realPath;
    for (let i = 0; i < depth; i++) dir = path.dirname(dir);
    return dir;
}

// ---------------------------------------------------------------------------
// Phase 1 — Resolve transitive dependencies
// ---------------------------------------------------------------------------

/**
 * Walk the pnpm virtual store context of every package already present in
 * `node_modules/`, copying any sibling dependency that is not yet present
 * at the top level.  Repeat until no new packages are added (transitive
 * closure).
 *
 * MUST run before symlinks are dereferenced — we rely on `fs.realpathSync`
 * following pnpm symlinks to discover the `.pnpm/` context directories.
 */
function resolveTransitiveDeps(nmDir) {
    const nmAbs = path.resolve(ROOT, nmDir);
    if (!fs.existsSync(nmAbs)) return 0;

    const processedContexts = new Set();
    const contextQueue = [];

    // Seed the queue with every symlinked package's pnpm context.
    for (const pkgName of listTopLevelPackages(nmAbs)) {
        const pkgPath = path.join(nmAbs, pkgName);
        try {
            if (!fs.lstatSync(pkgPath).isSymbolicLink()) continue;
            const realPath = fs.realpathSync(pkgPath);
            const ctxDir = pnpmContextDir(realPath, pkgName);
            if (ctxDir.includes('.pnpm') && !processedContexts.has(ctxDir)) {
                processedContexts.add(ctxDir);
                contextQueue.push(ctxDir);
            }
        } catch { /* skip unresolvable entries */ }
    }

    let totalAdded = 0;

    // Safety limit — prevent runaway iteration in pathological dependency graphs.
    const MAX_CONTEXTS = 5000;

    while (contextQueue.length > 0) {
        if (processedContexts.size > MAX_CONTEXTS) {
            console.warn(`  ⚠ Reached ${MAX_CONTEXTS} context directories — stopping transitive resolution.`);
            break;
        }

        const ctxDir = contextQueue.shift();

        // Iterate siblings in this .pnpm context's node_modules.
        let entries;
        try { entries = fs.readdirSync(ctxDir); } catch { continue; }
        for (const entry of entries) {
            if (entry === '.pnpm' || entry.startsWith('.')) continue;

            const processEntry = (depName, entryPath) => {
                const targetPath = path.join(nmAbs, depName);
                if (fs.existsSync(targetPath)) return; // already present

                // Resolve the real path of this pnpm-store entry.
                let realDepPath;
                try {
                    const stat = fs.lstatSync(entryPath);
                    realDepPath = stat.isSymbolicLink()
                        ? fs.realpathSync(entryPath)
                        : entryPath;
                } catch { return; }

                // Ensure scope directory exists for scoped packages.
                if (depName.includes('/')) {
                    fs.mkdirSync(path.join(nmAbs, depName.split('/')[0]), { recursive: true });
                }

                console.log(`  + ${depName}`);
                fs.cpSync(realDepPath, targetPath, { recursive: true, dereference: true });
                totalAdded++;

                // Enqueue this dep's own pnpm context so its transitive deps
                // are also resolved on a subsequent iteration.
                const depCtxDir = pnpmContextDir(realDepPath, depName);
                if (depCtxDir.includes('.pnpm') && !processedContexts.has(depCtxDir)) {
                    processedContexts.add(depCtxDir);
                    contextQueue.push(depCtxDir);
                }
            };

            if (entry.startsWith('@')) {
                const scopeDir = path.join(ctxDir, entry);
                try {
                    if (!fs.statSync(scopeDir).isDirectory()) continue;
                } catch { continue; }
                for (const sub of fs.readdirSync(scopeDir)) {
                    processEntry(`${entry}/${sub}`, path.join(scopeDir, sub));
                }
            } else {
                processEntry(entry, path.join(ctxDir, entry));
            }
        }
    }

    return totalAdded;
}

// ---------------------------------------------------------------------------
// Phase 2 — Dereference symlinks
// ---------------------------------------------------------------------------

/**
 * Replace a pnpm symlink with a real copy of the target directory.
 */
function derefSymlink(pkgPath) {
    const abs = path.resolve(ROOT, pkgPath);
    if (!fs.existsSync(abs)) {
        console.warn(`  ⚠ ${pkgPath} not found — skipping`);
        return false;
    }

    const stat = fs.lstatSync(abs);
    if (!stat.isSymbolicLink()) {
        return true;
    }

    const realPath = fs.realpathSync(abs);
    console.log(`  → Dereferencing ${pkgPath}`);

    // Copy to a temp location first, then swap — avoids data loss if cpSync fails.
    // dereference:true ensures nested pnpm .pnpm-store symlinks inside the package
    // are also resolved to real files, which is required by Vercel's function bundler.
    const tmpPath = abs + '.tmp';
    fs.cpSync(realPath, tmpPath, { recursive: true, dereference: true });
    fs.unlinkSync(abs);
    fs.renameSync(tmpPath, abs);
    return true;
}

/**
 * Walk a directory and dereference all symlinks found at the top level.
 * Handles scoped packages (@scope/pkg) by walking one level deeper.
 */
function derefAllSymlinks(nmDir) {
    const abs = path.resolve(ROOT, nmDir);
    if (!fs.existsSync(abs)) return 0;

    let count = 0;
    for (const entry of fs.readdirSync(abs)) {
        // Skip the .pnpm virtual store and hidden files
        if (entry === '.pnpm' || entry.startsWith('.')) continue;

        const entryPath = path.join(abs, entry);

        // Scoped package — walk one level deeper
        if (entry.startsWith('@')) {
            if (!fs.existsSync(entryPath)) continue;
            for (const sub of fs.readdirSync(entryPath)) {
                const rel = path.join(nmDir, entry, sub);
                if (derefSymlink(rel)) count++;
            }
            continue;
        }

        const rel = path.join(nmDir, entry);
        if (derefSymlink(rel)) count++;
    }
    return count;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('\n🔧 Patching pnpm symlinks for Vercel deployment…\n');

console.log('Phase 1: Resolving transitive dependencies…');
const transCount = resolveTransitiveDeps('node_modules');
console.log(`  Added ${transCount} transitive dependencies.\n`);

console.log('Phase 2: Dereferencing symlinks…');
const count = derefAllSymlinks('node_modules');
console.log(`\n✅ Patch complete — dereferenced ${count} packages, added ${transCount} transitive deps\n`);
