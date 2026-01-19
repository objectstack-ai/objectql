import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/home-layout';
import { baseOptions } from '@/app/layout.config';

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions}>
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              The Standard Protocol for <br className="hidden md:inline" />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                AI Software Generation
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Decouple Intent from Implementation. <br />
              Hallucination-Free. Type-Safe. Production-Ready.
            </p>
            <div className="flex gap-4">
              <Link
                href="/docs"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
               Get Started
              </Link>
              <Link
                href="https://github.com/objectql/objectql"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                GitHub
              </Link>
            </div>
          </div>
        </section>

        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                 <div className="space-y-2">
                  <h3 className="font-bold">Protocol-Driven</h3>
                  <p className="text-sm text-muted-foreground">
                    We decouple Intent (YAML Schema) from Implementation (TypeScript). Build software that is easy for AIs to understand and generate.
                  </p>
                </div>
              </div>
            </div>
             <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                 <div className="space-y-2">
                  <h3 className="font-bold">Compiler, Not ORM</h3>
                  <p className="text-sm text-muted-foreground">
                     ObjectQL is not a runtime wrapper. It compiles abstract intent (AST) into optimized database queries. Zero runtime overhead.
                  </p>
                </div>
              </div>
            </div>
             <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                 <div className="space-y-2">
                  <h3 className="font-bold">Security by Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Permissions (RBAC) and Validation are injected automatically by the Core engine during the compilation phase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8 md:py-12 lg:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                    Metadata-Driven Architecture
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Define your data model in simple YAML. Let ObjectQL handle the database, API, and type definitions.
                </p>
                
                <div className="w-full text-left bg-slate-950 p-4 rounded-lg overflow-x-auto mt-8 border border-slate-800 shadow-2xl">
                    <pre className="text-sm font-mono text-slate-50">
{`# project.object.yml
name: project
fields:
  name:
    type: text
    required: true
  status:
    type: select
    options: [planning, active, completed]
    default: planning
  owner:
    type: lookup
    reference_to: users`}
                    </pre>
                </div>
            </div>
        </section>

      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built by the ObjectQL Team. The source code is available on <a href="https://github.com/objectql/objectql" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">GitHub</a>.
            </p>
        </div>
      </footer>
    </HomeLayout>
  );
}
