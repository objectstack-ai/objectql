import type { BaseLayoutProps } from 'fumadocs-ui/layout';
import { Book, Code2, FileText, Sparkles } from 'lucide-react';

export const baseOptions: BaseLayoutProps = {
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
