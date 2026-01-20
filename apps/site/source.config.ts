import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkGfm, // GitHub Flavored Markdown (tables, strikethrough, task lists, etc.)
      remarkMath, // Math equations support
    ],
    rehypePlugins: [
      rehypeSlug, // Add IDs to headings
      [rehypeAutolinkHeadings, { behavior: 'wrap' }], // Add links to headings
      rehypeKatex, // Render math equations
      [rehypeCode, {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
      }],
    ],
  },
});
