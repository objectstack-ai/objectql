import Link from 'next/link';

export function BetaBanner() {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              β
            </span>
            <p className="text-sm font-medium">
              <span className="inline">
                ObjectQL v2.0 is currently in Beta.{' '}
              </span>
              <span className="hidden sm:inline">
                We&apos;re actively developing new features and improving stability.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs/getting-started"
              className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
