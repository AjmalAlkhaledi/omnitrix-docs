# Omnitrix Documentation

Source of the Omnitrix documentation site, built with [Docusaurus](https://docusaurus.io/).

```sh
npm install
npm start          # live preview on http://localhost:3000
npm run build      # static site in build/
npm run serve      # serve the built site
```

Pages are Markdown files in `docs/`; the sidebar is defined in `sidebars.js`. Set `DOCS_URL` and
`DOCS_BASE_URL` when building for a public address.

The API reference pages (`docs/reference/`) are generated from the framework and Core sources;
with the repositories checked out next to this one and their dependencies installed:

```sh
npm run api
```

## License

The documentation is released under the [MIT license](LICENSE).
