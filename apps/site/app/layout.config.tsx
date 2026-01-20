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
  // Enable sidebar search
  sidebar: {
    defaultOpenLevel: 0,
    banner: (
      <div className="text-sm text-muted-foreground">
        ObjectQL Documentation
      </div>
    ),
  },
  // Enable table of contents
  toc: {
    enabled: true,
    component: undefined,
  },
  // Enable last updated timestamp
  lastUpdate: {
    enabled: true,
    showTimestamp: true,
  },
  // Enable edit on GitHub
  editOnGithub: {
    enabled: true,
    base: 'https://github.com/objectstack-ai/objectql/blob/main/apps/site',
  },
};
