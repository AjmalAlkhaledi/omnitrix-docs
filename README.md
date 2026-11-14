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

The API reference pages (`docs/reference/`) are generated from the framework and Core sources;
with the repositories checked out next to this one and their dependencies installed:

```sh
npm run api
```

## License

The documentation is released under the [MIT license](LICENSE).
