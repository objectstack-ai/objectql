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
    footer: (
      <div className="flex flex-col gap-2 border-t pt-4 mt-4 text-xs">
        <a
          href="https://github.com/objectstack-ai/objectql/blob/main/apps/site"
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          Edit this page on GitHub →
        </a>
      </div>
    ),
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
