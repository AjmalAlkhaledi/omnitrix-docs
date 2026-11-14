// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Omnitrix',
  tagline: 'Asynchronous PHP APIs on OpenSwoole',
  favicon: 'img/favicon.svg',

  // Published on GitHub Pages; DOCS_URL and DOCS_BASE_URL override the address (for example for another host).
  url: process.env.DOCS_URL || 'https://ajmalalkhaledi.github.io',
  baseUrl: process.env.DOCS_BASE_URL || '/omnitrix-docs/',
  organizationName: 'AjmalAlkhaledi',
  projectName: 'omnitrix-docs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  markdown: {
    // Plain .md files are CommonMark, so `{id:\d+}` and `<` in prose need no escaping.
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: 'Omnitrix',
        logo: { alt: 'Omnitrix', src: 'img/logo.svg' },
        items: [
          { type: 'docSidebar', sidebarId: 'guide', position: 'left', label: 'Guide' },
          { type: 'docSidebar', sidebarId: 'reference', position: 'left', label: 'Reference' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Installation', to: '/getting-started/installation' },
              { label: 'Your first API', to: '/getting-started/first-api' },
              { label: 'Architecture', to: '/architecture/overview' },
            ],
          },
          {
            title: 'Packages',
            items: [
              { label: 'omnitrix/omnitrix (application)', to: '/getting-started/directory-structure' },
              { label: 'omnitrix/framework', to: '/reference/framework-api' },
              { label: 'omnitrix/core', to: '/reference/core-api' },
              { label: 'omnitrix/installer', to: '/getting-started/installation' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ajmal Alkhaledi. Released under the MIT License.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['php', 'bash', 'ini', 'nginx', 'json'],
      },
    }),
};

export default config;
