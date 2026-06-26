# BulkMeta

BulkMeta is a Webflow Designer app for editing SEO and Open Graph metadata faster. It is built for page-by-page edits and bulk updates, with dynamic page-name templates, image selection from Webflow Assets, CSV import/export, and helpful SEO length guidance.

## Features

- Edit SEO title and meta description for individual Webflow pages.
- Bulk edit selected pages with dynamic `{page}` title templates.
- Include or exclude pages before bulk updates.
- Sync Open Graph title and description from SEO fields.
- Choose an Open Graph image from Webflow Assets or paste an image URL.
- Search pages by page name.
- Sort pages by grouped order, A-Z, or Z-A.
- Import and export page metadata as CSV.
- Light, dark, and system theme support.
- Inline save status with a warning to keep Webflow Page Settings closed while saving.

## Tech Stack

- React
- TypeScript
- Vite
- Webflow Designer Extension API
- Lucide React icons

## Local Development

Install dependencies:

```bash
npm install
```

Run the app locally in Webflow Designer:

```bash
npm run webflow:dev
```

This builds the app, watches for changes, and serves the Webflow extension locally on port `1337`.

## Build

Create a production build:

```bash
npm run build
```

## Create Webflow Bundle

Generate `bundle.zip` for uploading to Webflow:

```bash
npm run webflow:bundle
```

The generated `bundle.zip` is the file to upload in the Webflow app dashboard.

## Project Structure

```text
src/
  main.tsx      App logic and Webflow API integration
  styles.css    UI styling, themes, layout, and component states
public/
  bulkseo-free-icon.png
webflow.json    Webflow extension manifest
```

## Notes

BulkMeta uses Webflow's Designer Extension API, so page metadata is saved directly through Webflow while the app runs inside Designer. During saving, avoid opening Webflow's native Page Settings panel for the same pages until the save finishes.
