import Link from 'next/link';

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-green-500"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CodeBlock({ title, content, lang = 'yaml' }: { title: string, content: string, lang?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-slate-950 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs sm:text-sm font-mono leading-relaxed text-slate-300">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* --- Hero Section --- */}
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
          <div className="container relative z-10 flex flex-col items-center gap-6 text-center">
            
            {/* Logic Badge */}
            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-500 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              v2.0 Architecture Preview
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground">
              The Standard Protocol for <br className="hidden md:inline" />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
                AI Software Generation
              </span>
            </h1>
            
            <p className="max-w-[42rem] text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Stop debugging AI-generated boilerplate. Start defining <span className="text-foreground font-semibold">Intent</span>.
              <br />
              ObjectQL decouples your Data Model from the Implementation Details.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/docs"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105"
              >
                Read the Spec
              </Link>
              <Link
                href="/docs/getting-started"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Background Gradient Mesh */}
          <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20 bg-[radial-gradient(circle,rgba(59,130,246,0.5)_0%,transparent_70%)]" />
        </section>

        {/* --- Value Proposition Grid --- */}
        <section className="container py-12 md:py-24 border-t bg-gradient-to-b from-background to-muted/20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            
            <div className="group rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Protocol-Driven</h3>
              <p className="text-muted-foreground">
                Define your application in pure YAML/JSON schema. It&apos;s the perfect interface for LLMs to read and write without syntax errors.
              </p>
            </div>

            <div className="group rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Security by Design</h3>
              <p className="text-muted-foreground">
                Never write a permission check again. RBAC rules are declarative and enforced by the engine at the lowest level.
              </p>
            </div>

            <div className="group rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Compiler, Not ORM</h3>
              <p className="text-muted-foreground">
                ObjectQL compiles your intent into highly optimized SQL. No runtime reflection overhead for maximum performance.
              </p>
            </div>

          </div>
        </section>

        {/* --- Code Demo Section --- */}
        <section className="container py-12 md:py-24">
          <div className="flex flex-col items-center text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Write Intent. Generate Software.
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Describe your data model and business rules. ObjectQL handles the Database Schema, API Endpoints, and Type Definitions.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                 <span className="font-semibold">Define Object (YAML)</span>
              </div>
              <CodeBlock 
                title="project.object.yml" 
                content={`name: project
description: Manage internal projects
fields:
  name:
    type: text
    required: true
    index: true
  status:
    type: select
    options: [planning, active, paused]
    default: planning
  budget:
    type: currency
    scale: 2
  owner:
    type: lookup
    reference_to: users`} 
              />
              
              <div className="flex items-center gap-2 mb-2 mt-6">
                 <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                 <span className="font-semibold">Define Logic (YAML)</span>
              </div>
               <CodeBlock 
                title="project.validation.yml" 
                content={`on: project
rules:
  - when: { status: active }
    ensure: { budget: { gt: 0 } }
    message: "Active projects must have budget"`} 
              />
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">3</div>
                 <span className="font-semibold">Generated API & Types</span>
              </div>
              <CodeBlock 
                title="Generated Output" 
                lang="typescript"
                content={`// 1. Fully Typed TypeScript Interfaces
export interface Project {
  _id: string;
  name: string;
  status: 'planning' | 'active' | 'paused';
  budget?: number;
  owner?: string; // ID reference
}

// 2. Auto-generated Database Schema (SQL)
// CREATE TABLE project (
//   _id VARCHAR(255) PRIMARY KEY,
//   name TEXT NOT NULL,
//   status VARCHAR(50) DEFAULT 'planning',
//   ...
// );

// 3. Instant JSON-RPC / GraphQL API
// POST /api/rpc
// { "method": "project.create", "params": { ... } }`} 
              />

              <div className="rounded-lg border bg-muted/50 p-6 mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                   What you get automatically:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                   <div className="flex items-center gap-2"><CheckIcon /> CRUD Operations</div>
                   <div className="flex items-center gap-2"><CheckIcon /> Input Validation</div>
                   <div className="flex items-center gap-2"><CheckIcon /> Filtering & Sorting</div>
                   <div className="flex items-center gap-2"><CheckIcon /> Pagination</div>
                   <div className="flex items-center gap-2"><CheckIcon /> TypeScript SDK</div>
                   <div className="flex items-center gap-2"><CheckIcon /> Database Migrations</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Architecture Diagram (Simplified) --- */}
        <section className="container py-16 md:py-24 border-t">
            <h2 className="text-3xl font-bold text-center mb-12">The ObjectStack Ecosystem</h2>
            <div className="relative mx-auto max-w-4xl p-8 border rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                {/* Visual Representation of Stack */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    
                    {/* Column 1: Sources */}
                    <div className="space-y-2">
                        <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border shadow-sm">
                            <h4 className="font-bold text-blue-600">Schema</h4>
                            <p className="text-xs text-muted-foreground">*.object.yml</p>
                        </div>
                         <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border shadow-sm">
                            <h4 className="font-bold text-blue-600">Logic</h4>
                            <p className="text-xs text-muted-foreground">*.validation.yml</p>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex flex-col items-center justify-center">
                         <div className="text-xs font-mono text-muted-foreground mb-2">Compile</div>
                         <svg className="w-8 h-8 text-muted-foreground animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>

                    {/* Column 3: Engine */}
                    <div className="flex flex-col justify-center">
                         <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border border-slate-700">
                            <h3 className="font-bold text-xl mb-2">ObjectQL Engine</h3>
                            <ul className="text-xs text-slate-300 space-y-1 text-left list-disc list-inside">
                                <li>Schema Registry</li>
                                <li>Query Optimizer</li>
                                <li>Permission Guard</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="col-span-1 md:col-start-3">
                        <div className="h-8 w-px bg-border mx-auto"></div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                             <div className="p-2 rounded border bg-background text-xs font-mono">Postgres</div>
                             <div className="p-2 rounded border bg-background text-xs font-mono">Mongo</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- CTA Section --- */}
        <section className="container py-12 md:py-24 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to standardize your AI output?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join the architects building the next generation of software factories.
            </p>
            <div className="flex justify-center gap-4">
               <Link
                href="/docs"
                className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Documentation
              </Link>
              <Link
                href="https://github.com/objectql/objectql"
                className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
