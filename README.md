# ARB Editor

A web app to edit Flutter ARB localization files in a table view, manage metadata, and export updated files.

## Features

- Upload multiple `.arb` files (drag-and-drop or file picker)
- Auto-detect locale from `@@locale` (fallback from filename)
- Display all keys across locales in one table
- Highlight missing translations and filter by:
  - all keys
  - missing localization only
- Group keys by prefix and browse groups in the sidebar
- Edit translation values inline
- Add/edit/clone key metadata (`@key`)
- Auto-translate cell from Vietnamese source locale to target locale
- Download:
  - single locale ARB
  - all locales as ZIP
- Save and restore draft from local storage
- Switch UI language (English/Vietnamese) and theme (light/dark/system)

## Tech Stack

- Next.js 16
- React 19 + TypeScript
- Tailwind CSS
- `next-intl` for UI localization
- `next-themes` for theme switching
- `jszip` for batch export

## Requirements

- Node.js 20+ recommended
- npm (comes with Node.js)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## How to Use

1. Upload ARB files.
2. Search/filter keys and select filter mode.
3. Edit translations in table cells.
4. Add metadata where needed.
5. Use translate action for missing target text.
6. Download one locale or all locales as ZIP.

## ARB Notes

- Each ARB file should include `@@locale`.
- Translation entries are string values.
- Metadata entries use `@<key>` and must be JSON objects.
- Duplicate locale files are rejected on import.

## Project Structure

- `app/` - Next.js app routes and API handlers
- `components/` - UI components
- `lib/` - Parsing, exporting, grouping, and translation utilities
- `messages/` - UI i18n messages (`en.json`, `vi.json`)

## API

- `POST /api/translate`
  - Input: `text`, `sourceLocale`, `targetLocale`
  - Output: `translatedText`

