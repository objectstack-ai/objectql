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
      { text: 'Tutorials', link: '/tutorials/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'AI Agents', link: '/ai/' },
      { 
        text: 'Reference', 
        items: [
          { text: 'Protocol Spec (YAML)', link: '/spec/' },
          { text: 'Node.js SDK', link: '/api/' },
        ]
      },
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for Tutorials
      '/tutorials/': [
        {
          text: 'Tutorials',
          items: [
            { text: 'Overview', link: '/tutorials/' },
            { text: '1. Task Manager (Beginner)', link: '/tutorials/task-manager' },
            { text: '2. Micro-CRM (Intermediate)', link: '/tutorials/crm-system' },
            { text: '3. Federated Data (Advanced)', link: '/tutorials/federation' },
            { text: '4. AI Data Agent (AI-Native)', link: '/tutorials/ai-agent' },
          ]
        }
      ],
      
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
             { text: 'Generating Apps (Zero-Shot)', link: '/ai/generating-apps' },
             { text: 'Building AI Agents', link: '/ai/building-apps' },
             { text: 'AI Coding Assistant', link: '/ai/coding-assistant' },
           ]
         }
      ],

      // Sidebar for Guide section
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Why ObjectQL?', link: '/guide/architecture/why-objectql' },
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: 'IDE Setup', link: '/guide/ide-setup' },
          ]
        },
        {
          text: 'Data & Logic Layers',
          items: [
            { text: 'Data Modeling', link: '/guide/data-modeling' },
            { text: 'Querying Data', link: '/guide/querying' },
            { text: 'Formulas & Rules Syntax', link: '/guide/formulas-and-rules' },
            { text: '↳ Quick Reference', link: '/guide/formulas-and-rules-quick-ref' },
            { text: 'Business Logic (Hooks)', link: '/guide/logic-hooks' },
            { text: 'Custom Actions (RPC)', link: '/guide/logic-actions' },
          ]
        },
        {
          text: 'System Architecture',
          items: [
            { text: 'File Organization', link: '/guide/metadata-organization' },
            { text: 'Microservices & Federation', link: '/guide/microservices' },
            { text: 'Plugin System', link: '/guide/plugins' },
          ]
        },
        {
          text: 'Low-Code UI',
          items: [
            { text: 'Page & Layouts', link: '/guide/page-metadata' },
          ]
        },
        {
          text: 'Operations & Deployment',
          items: [
            { text: 'Server Integration', link: '/guide/server-integration' },
            { text: 'Database Drivers', link: '/guide/drivers/' },
            { text: 'CLI Tools', link: '/guide/cli' },
            { text: 'Configuration', link: '/guide/configuration' },
          ]
        },
        {
          text: 'Legal',
          items: [
            { text: 'License', link: '/guide/license' },
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
            { text: 'Menus & Navigation', link: '/spec/menu' },
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
      message: 'Released under the PolyForm Shield License 1.0.0.',
      copyright: 'Copyright © 2026 ObjectQL'
    }
  }
})
