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
      { text: 'AI-Native', link: '/ai/' },
      { text: 'Protocol', link: '/spec/' },
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for AI section
      '/ai/': [
         {
           text: 'AI-Native Ecosystem',
           items: [
             { text: 'Overview', link: '/ai/' },
             { text: 'Building AI Apps', link: '/ai/building-apps' },
             { text: 'AI Coding Assistant', link: '/ai/coding-assistant' },
           ]
         }
      ],

      // Sidebar for Guide section
      '/guide/': [
        {
          text: 'Start Here',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: '🤖 AI Coding Setup', link: '/ai/coding-assistant' },
          ]
        },
        {
          text: 'Core Fundamentals',
          items: [
            { text: 'Data Modeling', link: '/guide/data-modeling' },
            { text: 'Querying Data', link: '/guide/querying' },
            { text: 'Business Logic', link: '/guide/logic-hooks' },
          ]
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Microservices & Federation', link: '/guide/microservices' },
            { text: 'Custom Actions (RPC)', link: '/guide/logic-actions' },
            { text: 'Plugin System', link: '/guide/plugins' },
          ]
        },
        {
          text: 'Integration & Deployment',
          items: [
            { text: 'Server Integration', link: '/guide/server-integration' },
            { text: 'Database Drivers', link: '/guide/drivers/' },
            { text: 'CLI Tools', link: '/guide/cli' },
            { text: 'Configuration', link: '/guide/configuration' },
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
