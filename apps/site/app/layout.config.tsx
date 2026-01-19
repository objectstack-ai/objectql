import type { DocsLayoutProps } from 'fumadocs-ui/layout';
import { Logo } from '@/components/logo';

export const baseOptions: Omit<DocsLayoutProps, 'tree'> = {
  nav: {
    title: <Logo />,
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
