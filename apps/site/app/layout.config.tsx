import type { DocsLayoutProps } from 'fumadocs-ui/layout';
// @ts-ignore: optional dev dependency for icons (some environments may not have types)
import { Book, Code2, FileText, Sparkles } from 'lucide-react';

export const baseOptions: Omit<DocsLayoutProps, 'tree'> = {
  nav: {
    title: 'ObjectQL',
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
  ],
  githubUrl: 'https://github.com/objectstack-ai/objectql',
};
