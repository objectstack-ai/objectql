import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "ObjectQL",
  description: "A Unified Data Management Framework",
  
  // Scans the docs directory
  srcDir: '.',

  // Ignore dead links from merged documentation
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '/logo.svg',
    // Top Navigation
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Specifications', link: '/spec/' },
      { text: 'AI Context', link: '/AI_CONTEXT' }
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for Guide section
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Data Modeling', link: '/guide/data-modeling' },
            { text: 'Security Guide', link: '/guide/security-guide' }
          ]
        },
        {
          text: 'Server-Side Logic',
          items: [
            { text: 'SDK Reference', link: '/guide/sdk-reference' },
            { text: 'Writing Hooks', link: '/guide/logic-hooks' },
            { text: 'Hooks Examples', link: '/guide/logic-hooks-examples' },
            { text: 'Custom Actions', link: '/guide/logic-actions' }
          ]
        }
      ],

      // Sidebar for Spec section
      '/spec/': [
        {
          text: 'Protocol Specifications',
          items: [
            { text: 'Overview', link: '/spec/' },
            { text: 'Metadata Format', link: '/spec/metadata-format' },
            { text: 'Query Language', link: '/spec/query-language' },
            { text: 'HTTP Protocol', link: '/spec/http-protocol' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/objectql/objectql' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 ObjectQL'
    }
  }
})
