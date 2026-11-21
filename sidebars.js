// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guide: [
    'intro',
    {
      type: 'category',
      label: 'Getting started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/first-api',
        'getting-started/directory-structure',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'The basics',
      items: ['basics/console', 'basics/routing', 'basics/middleware', 'basics/requests-responses', 'basics/validation', 'basics/file-storage', 'basics/events', 'basics/context', 'basics/sessions', 'basics/authentication', 'basics/authorization', 'basics/security'],
    },
    {
      type: 'category',
      label: 'Database',
      items: ['database/getting-started', 'database/query-builder', 'database/migrations', 'database/models', 'database/relationships', 'database/seeding', 'database/factories', 'database/row-cache'],
    },
    {
      type: 'category',
      label: 'Async & services',
      items: ['async/concurrency', 'async/http-client', 'async/redis-cache', 'async/queues', 'async/mail', 'async/notifications', 'async/broadcasting', 'async/cpu-pool', 'async/sockets-files'],
    },
    {
      type: 'category',
      label: 'Operations',
      items: ['operations/runtime', 'operations/scheduling', 'operations/observability', 'operations/deployment', 'operations/testing', 'operations/troubleshooting'],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/core',
        'architecture/platform-notes',
        {
          type: 'category',
          label: 'Decision records',
          items: ['architecture/adr/runtime-selection', 'architecture/adr/async-io-strategy', 'architecture/adr/database-driver-strategy', 'architecture/adr/package-split', 'architecture/adr/row-cache'],
        },
      ],
    },
    'contributing',
  ],
  reference: ['reference/api', 'reference/versioning', 'reference/contracts'],
};

export default sidebars;
