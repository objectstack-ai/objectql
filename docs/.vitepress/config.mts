import { defineConfig } from 'vitepress'

const guideSidebar = [
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
    text: 'Project Planning',
    items: [
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'Development Plan', link: '/development-plan' },
      { text: 'Project Status', link: '/project-status' },
      { text: 'Contributing', link: '/contributing' },
    ]
  },
  {
    text: 'Tutorials',
    items: [
      { text: 'Overview', link: '/tutorials/' },
      { text: '1. Task Manager (Beginner)', link: '/tutorials/task-manager' },
      { text: '2. Micro-CRM (Intermediate)', link: '/tutorials/crm-system' },
      { text: '3. Federated Data (Advanced)', link: '/tutorials/federation' },
      { text: '4. AI Data Agent (AI-Native)', link: '/tutorials/ai-agent' },
    ]
  },
  {
    text: 'Data & Logic Layers',
    items: [
      { text: 'Data Modeling', link: '/guide/data-modeling' },
      { text: 'Unified ID Migration', link: '/guide/migration-id-field' },
      { text: 'Querying Data', link: '/guide/querying' },
      { text: 'Query Best Practices', link: '/guide/query-best-practices' },
      { text: 'Formulas & Rules Syntax', link: '/guide/formulas-and-rules' },
      { text: '↳ Quick Reference', link: '/guide/formulas-and-rules-quick-ref' },
      { text: 'Business Logic (Hooks)', link: '/guide/logic-hooks' },
      { text: 'Custom Actions (RPC)', link: '/guide/logic-actions' },
    ]
  },
  {
    text: 'System Architecture',
    items: [
      { text: 'Architecture Overview', link: '/guide/architecture/overview' },
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
];

export default defineConfig({
  title: "ObjectQL",
  description: "A Unified Data Management Framework",
  
  // Scans the docs directory
  srcDir: '.',

  // Enable Clean URLs (e.g. /guide/getting-started instead of /guide/getting-started.html)
  cleanUrls: true,

  // Ignore dead links from merged documentation
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '/logo.svg',
    // Top Navigation
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Planning', link: '/planning' },
      { text: 'AI-Native', link: '/ai/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Specification', link: '/spec/' },
      { 
        text: 'Ecosystem', 
        items: [
          { text: 'ObjectStack AI', link: 'https://objectstack.ai' },
          { text: 'ObjectOS (Runtime)', link: 'https://www.objectos.org' },
          { text: 'ObjectUI (Frontend)', link: 'https://www.objectui.org' },
        ]
      },
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for Planning
      '/planning': [
        {
          text: 'Project Planning',
          items: [
            { text: 'Overview', link: '/planning' },
            { text: 'Roadmap', link: '/roadmap' },
            { text: 'Development Plan', link: '/development-plan' },
            { text: 'Project Status', link: '/project-status' },
            { text: 'Contributing Guide', link: '/contributing' },
          ]
        }
      ],

      // Sidebar for Tutorials
      '/tutorials/': guideSidebar,
      
      // Sidebar for API section
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Protocol Styles', items: [
                { text: 'JSON-RPC', link: '/api/json-rpc' },
                { text: 'REST API', link: '/api/rest' },
                { text: 'GraphQL', link: '/api/graphql' },
                { text: 'Metadata API', link: '/api/metadata' },
                { text: 'WebSocket', link: '/api/websocket' },
            ]},
            { text: 'Capabilities', items: [
                { text: 'Files & Attachments', link: '/api/attachments' },
                { text: 'Authentication', link: '/api/authentication' },
                { text: 'Error Handling', link: '/api/error-handling' },
                { text: 'Rate Limiting', link: '/api/rate-limiting' },
            ]},
            { text: 'Examples', link: '/api/examples' },
            { text: 'Quick Reference', link: '/api/quick-reference' },
          ]
        }
      ],

      // Sidebar for AI section
      '/ai/': [
         {
           text: 'AI-Native Ecosystem',
           items: [
             { text: 'Overview', link: '/ai/' },
           ]
         },
         {
           text: 'Assisted Development',
           items: [
             { text: 'AI Coding Assistant', link: '/ai/coding-assistant' },
             { text: 'Generating Apps', link: '/ai/generating-apps' },
           ]
         },
         {
           text: 'Agentic Architecture',
           items: [
             { text: 'Building AI Agents', link: '/ai/building-apps' },
           ]
         },
         {
           text: 'Tools & Reference',
           items: [
             { text: 'AI CLI', link: '/ai/cli-usage' },
             { text: 'Agent SDK', link: '/ai/programmatic-api' },
           ]
         }
      ],

      // Sidebar for Guide section
      '/guide/': guideSidebar,

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
            { text: 'Data Seeding', link: '/spec/data' },
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
            { text: 'Applications', link: '/spec/app' },
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
