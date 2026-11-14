# Omnitrix Documentation

Source of the Omnitrix documentation site, built with [Docusaurus](https://docusaurus.io/).

```sh
npm install
npm start          # live preview on http://localhost:3000/omnitrix-docs/
npm run build      # static site in build/
npm run serve      # serve the built site
```

Pages are Markdown files in `docs/`; the sidebar is defined in `sidebars.js`.

The site is published at https://ajmalalkhaledi.github.io/omnitrix-docs/. Every push to `main`
builds it and updates the `gh-pages` branch (`.github/workflows/deploy.yml`). To publish
elsewhere, set `DOCS_URL` and `DOCS_BASE_URL` when building.

The API reference page (`docs/reference/api.md`) is generated from the `omnitrix/core` sources;
with that repository checked out next to this one as `omnitrix-core` and its dependencies
installed:

```sh
npm run api
```

## License

The documentation is released under the [MIT license](LICENSE).
