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
      { text: 'Protocol', link: '/spec/' },
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for Guide section
      '/guide/': [
        {
          text: 'Core Concepts',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Data Modeling', link: '/guide/data-modeling' },
          ]
        },
        {
          text: 'Database Drivers',
          items: [
            { text: 'Overview', link: '/guide/drivers/' },
            { text: 'SQL (Knex)', link: '/guide/drivers/sql' },
            { text: 'MongoDB', link: '/guide/drivers/mongo' },
          ]
        },
        {
          text: 'Building Apps',
          items: [
            { text: 'Writing Hooks', link: '/guide/logic-hooks' },
            { text: 'Custom Actions', link: '/guide/logic-actions' },
            { text: 'Plugin System', link: '/guide/plugins' },
            { text: 'Building AI Apps', link: '/guide/ai' },
            { text: 'CLI Tools', link: '/guide/cli' }
          ]
        }
      ],

      // Sidebar for Spec section
      '/spec/': [
        {
          text: 'Core Schema',
          items: [
            { text: 'Overview', link: '/spec/' },
            { text: 'Objects & Fields', link: '/spec/object' },
            { text: 'Actions (RPC)', link: '/spec/action' },
            { text: 'Hooks', link: '/spec/hook' },
          ]
        },
        {
          text: 'Data & Transport',
          items: [
            { text: 'Query Language', link: '/spec/query-language' },
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
