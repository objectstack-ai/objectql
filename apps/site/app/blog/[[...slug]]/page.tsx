import { blogSource } from '@/lib/source';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { HomeLayout } from 'fumadocs-ui/home-layout';
import { baseOptions } from '@/app/layout.config';
import Link from 'next/link';

export default async function BlogPostPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <HomeLayout {...baseOptions}>
      <main className="container py-12 md:py-24">
        <article className="mx-auto max-w-4xl">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="mr-2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Blog
          </Link>

          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              {page.data.title}
            </h1>
            
            {page.data.description && (
              <p className="text-xl text-muted-foreground mb-4">
                {page.data.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              {page.data.date && (
                <time dateTime={page.data.date}>
                  {new Date(page.data.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
              {page.data.authors && (
                <span>by {page.data.authors.join(', ')}</span>
              )}
            </div>

            {page.data.tags && page.data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {page.data.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <MDX components={{ ...defaultMdxComponents }} />
          </div>

          <footer className="mt-12 pt-8 border-t">
            <Link 
              href="/blog" 
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Blog
            </Link>
          </footer>
        </article>
      </main>
    </HomeLayout>
  );
}

export async function generateStaticParams() {
  return blogSource.generateParams();
}

export function generateMetadata({ params }: { params: { slug?: string[] } }): Metadata {
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
