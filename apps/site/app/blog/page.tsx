import { blogSource } from '@/lib/source';
import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/home-layout';
import { baseOptions } from '@/app/layout.config';

export default function BlogPage() {
  const posts = blogSource.getPages();

  return (
    <HomeLayout {...baseOptions}>
      <main className="container py-12 md:py-24">
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
                        {post.data.tags.map((tag: string) => (
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
      </main>
    </HomeLayout>
  );
}
