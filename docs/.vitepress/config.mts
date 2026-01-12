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
      { text: 'API Reference', link: '/api/' },
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for API section
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Quick Reference', link: '/api/quick-reference' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Full Specification', link: '/api/README' },
          ]
        }
      ],

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
            { text: 'Page Metadata', link: '/guide/page-metadata' },
            { text: 'Metadata Organization', link: '/guide/metadata-organization' },
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
          text: 'Metadata Specifications',
          items: [
            { text: 'Overview', link: '/spec/' },
            { text: 'Complete Standard Guide', link: '/spec/metadata-standard' },
          ]
        },
        {
          text: 'Core Data Layer',
          items: [
            { text: 'Objects & Fields', link: '/spec/object' },
            { text: 'Query Language', link: '/spec/query-language' },
            { text: 'Validation Rules', link: '/spec/validation' },
          ]
        },
        {
          text: 'Business Logic Layer',
          items: [
            { text: 'Hooks (Triggers)', link: '/spec/hook' },
            { text: 'Actions (RPC)', link: '/spec/action' },
            { text: 'Workflows & Processes', link: '/spec/workflow' },
          ]
        },
        {
          text: 'Presentation Layer',
          items: [
            { text: 'Pages', link: '/spec/page' },
            { text: 'Views & Layouts', link: '/spec/view' },
            { text: 'Forms', link: '/spec/form' },
            { text: 'Reports & Dashboards', link: '/spec/report' },
            { text: 'Applications & Navigation', link: '/spec/application' },
          ]
        },
        {
          text: 'Security & Access Control',
          items: [
            { text: 'Permissions', link: '/spec/permission' },
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
