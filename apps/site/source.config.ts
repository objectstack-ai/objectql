import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
