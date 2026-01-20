import { blogSource } from '@/lib/source';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { HomeLayout } from 'fumadocs-ui/home-layout';
import { baseOptions } from '@/app/layout.config';
import Link from 'next/link';

// Blog listing component
function BlogListing() {
  const posts = blogSource.getPages();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          ObjectQL Blog
        </h1>
        <p className="text-lg text-muted-foreground">
          Updates, tutorials, and insights about the standard protocol for AI software generation
        </p>
      </div>

      <div className="space-y-8">
        {posts
          .sort((a, b) => {
            const dateA = new Date(a.data.date || 0);
            const dateB = new Date(b.data.date || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .map((post) => (
            <article
              key={post.url}
              className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md"
            >
              <Link href={post.url} className="block">
                <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
                  {post.data.date && (
                    <time dateTime={post.data.date}>
                      {new Date(post.data.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  {post.data.authors && (
                    <span>by {post.data.authors.join(', ')}</span>
                  )}
                </div>
                
                <h2 className="mb-2 text-2xl font-bold group-hover:text-primary transition-colors">
                  {post.data.title}
                </h2>
                
                {post.data.description && (
                  <p className="text-muted-foreground mb-4">
                    {post.data.description}
                  </p>
                )}

                {post.data.tags && post.data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.data.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

// Blog post component
function BlogPost({ page }: { page: ReturnType<typeof blogSource.getPage> }) {
  if (!page) return null;
  
  const MDX = page.data.body;

  return (
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
            {page.data.tags.map((tag) => (
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
  );
}

export default async function BlogPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  // If no slug, show blog listing
  if (!params.slug || params.slug.length === 0) {
    return (
      <HomeLayout {...baseOptions}>
        <main className="container py-12 md:py-24">
          <BlogListing />
        </main>
      </HomeLayout>
    );
  }

  // Otherwise, show individual blog post
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  return (
    <HomeLayout {...baseOptions}>
      <main className="container py-12 md:py-24">
        <BlogPost page={page} />
      </main>
    </HomeLayout>
  );
}

export async function generateStaticParams() {
  return blogSource.generateParams();
}

export function generateMetadata({ params }: { params: { slug?: string[] } }): Metadata {
  // Default metadata for blog listing
  if (!params.slug || params.slug.length === 0) {
    return {
      title: 'Blog',
      description: 'Updates, tutorials, and insights about the standard protocol for AI software generation',
    };
  }

  // Metadata for individual blog post
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
