# BulkMeta

**BulkMeta** is a free Webflow Designer extension for editing SEO and Open Graph metadata faster. It's built for page-by-page edits and bulk updates, with dynamic page-name templates, image selection from Webflow Assets, and CSV import/export.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev)

## Features

- ✏️ Edit SEO title and meta description for individual Webflow pages
- 🔄 Bulk edit selected pages with dynamic `{page}` title templates
- ✅ Include or exclude pages before bulk updates
- 🔗 Sync Open Graph title and description from SEO fields
- 🖼️ Choose an Open Graph image from Webflow Assets or paste an image URL
- 🔍 Search pages by page name
- 📊 Sort pages by grouped order, A-Z, or Z-A
- 📥 Import and export page metadata as CSV
- 🌓 Light, dark, and system theme support
- ⚡ Inline save status with a warning to keep Webflow Page Settings closed while saving

## Requirements

- Webflow account with Designer access
- Modern browser (Chrome, Safari, Firefox, Edge)

## Installation

BulkMeta is available as a Webflow Designer Extension. [Learn how to install it in your Webflow workspace](https://webflow.com).

## Tech Stack

- **React** 19 — UI framework
- **TypeScript** 5.7 — Type safety
- **Vite** 6 — Build tool
- **Webflow Designer Extension API** — Extension runtime
- **Lucide React** — Icon library

## Development

### Prerequisites

- Node.js 18+
- npm

### Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/kmbashar/bulkmeta.git
   cd bulkmeta
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the app locally in Webflow Designer:
   ```bash
   npm run webflow:dev
   ```

   This builds the app, watches for changes, and serves the Webflow extension locally on port `1337`.

### Build Commands

**Development build with watch mode:**
```bash
npm run build:watch
```

**Production build:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Create Webflow bundle for distribution:**
```bash
npm run webflow:bundle
```

The generated `bundle.zip` is the file to upload to the Webflow app dashboard.

## Project Structure

```
src/
  main.tsx      Main app component, Webflow API integration, and logic
  styles.css    UI styling, themes, layout, and component states
public/
  bulkseo-free-icon.png  App icon
webflow.json          Webflow extension manifest
package.json          Dependencies and scripts
```

## How It Works

BulkMeta runs as a Designer Extension inside Webflow's Designer interface. When you use the app:

1. **Load pages** — BulkMeta fetches all pages from your Webflow site
2. **Edit metadata** — Make changes to SEO and Open Graph fields in BulkMeta
3. **Preview** — See how bulk edits will apply using the `{page}` token
4. **Save** — Click save to write changes directly to Webflow via the Designer Extension API

**Important:** During saving, keep Webflow's native Page Settings panel closed to avoid conflicts.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Reporting bugs
- Suggesting features
- Setting up the development environment
- Submitting pull requests

## Code of Conduct

This project adheres to the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

BulkMeta is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Security

If you discover a security vulnerability, please see [SECURITY.md](./SECURITY.md) for responsible disclosure.

## Support

- 📖 [Read the README](./README.md)
- 🐛 [Report a bug](https://github.com/kmbashar/bulkmeta/issues)
- 💡 [Request a feature](https://github.com/kmbashar/bulkmeta/issues)
- 📝 [Check the changelog](./CHANGELOG.md)

## Acknowledgments

Built with [React](https://react.dev), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vitejs.dev).

---

Made with ❤️ for Webflow users
