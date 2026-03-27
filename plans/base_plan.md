Build a production-quality ARB Editor demo using Next.js (App Router) and TypeScript in a single project. The app is for editing Flutter `.arb` localization files across multiple locales in a spreadsheet-like table interface.

Main goal:
Create a clean, intuitive ARB Editor that allows users to upload multiple ARB files, view and edit translation keys across locales in a table layout, automatically group related keys using a smart prefix-based grouping algorithm, edit metadata for keys, and save/download the updated ARB files.

Tech stack:

- Next.js latest with App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui if useful
- Client-side only is fine for demo
- Keep architecture modular, clean, and maintainable

Core requirements:

1. ARB file upload

- Allow users to upload multiple `.arb` files from their computer
- Each uploaded file represents one locale
- Example files: `app_en.arb`, `app_vi.arb`, `app_ja.arb`
- Parse all uploaded ARB JSON files in the browser
- Detect locale from `@@locale` if present, otherwise infer from filename
- Show validation errors for invalid JSON, non-ARB files, or duplicate locales
- Store uploaded data in client state
- Since this is a demo, upload must be fully supported and easy to use

2. Spreadsheet-like table editor

- Build the main editor as a table that is easy to scan and edit
- Rows represent translation keys
- Columns represent locales
- First columns should include:
  - group
  - key
  - metadata indicator
- Locale columns should show editable translation values
- Use inline editing for translation cells
- Support many rows with good UX
- Sticky header
- Sticky left columns for group/key if practical
- Add search/filter for keys
- Add sorting by key/group
- Allow collapsing and expanding groups
- Make the UI feel like a lightweight internal localization management tool

3. Smart key grouping algorithm
   Implement automatic grouping for translation keys with a non-trivial algorithm.

Grouping rules:

- Only keys containing `_` should be grouped
- Keys without `_` should remain ungrouped or be placed in an `Ungrouped` section
- Group keys by shared prefix
- Prefix is defined by splitting a key by `_`
- The grouping algorithm should find the most natural and cohesive prefix grouping
- Grouping depth should be up to 5 prefix segments when meaningful

Examples:

- `a_b_c_d` and `a_b_c_e` should be grouped under `a_b_c`
- `a_b_c_d_e_f` and `a_b_c_d_e_g` should be grouped under `a_b_c_d_e`

Expected behavior:

- Prefer the longest useful shared prefix among related sibling keys
- Avoid grouping unrelated keys under very short prefixes
- Avoid over-fragmenting into too many tiny groups
- If multiple candidate groups exist, choose the most specific useful group
- If no meaningful shared prefix exists, leave the key ungrouped
- Return stable, deterministic grouping results

Implementation expectations for grouping:

- Create this as a reusable utility function
- Add clear comments explaining the algorithm
- Suggested approach:
  1. Split keys by `_`
  2. Ignore keys without `_`
  3. Build prefix candidates from depth 1 to 5
  4. Score prefix candidates by cohesion and usefulness
  5. Prefer longer prefixes when they group at least 2 strongly related keys
  6. Avoid weak or noisy group assignments
  7. Return a stable group mapping for every key
- Show the computed group name in the UI
- Let users collapse/expand by group
- Show the number of keys per group

4. Metadata editing
   ARB metadata is represented by keys prefixed with `@`.

Example:

- translation key: `home_title`
- metadata key: `@home_title`

Requirements:

- Detect metadata entries and link them to their base translation key
- Keys with metadata should be lightly highlighted in the UI
- Show a subtle metadata badge/icon/indicator
- Allow expanding a row to reveal metadata editing UI
- Metadata should be editable as structured JSON fields when possible, not just a raw JSON blob
- Support common metadata fields like:
  - `description`
  - `placeholders`
  - `type`
  - arbitrary extra fields
- Preserve metadata structure when saving/exporting
- Show validation feedback if metadata becomes invalid
- Expanded metadata editing should feel clean and unobtrusive

5. Multi-locale editing

- Show all locales side by side in the same table
- If a key exists in one locale but not another, still show the row
- Allow adding or editing missing values directly in empty cells
- Use the union of all translation keys across uploaded ARB files
- Metadata should be associated with the base key and preserved properly
- Keep locale-specific values accurate and isolated

6. Save and download

- Users must be able to save and download all edited ARB files
- Reconstruct each locale as valid ARB JSON
- Preserve:
  - `@@locale`
  - translation keys
  - metadata keys like `@my_key`
- Support:
  - download each ARB file individually
  - download all ARB files together, preferably as a ZIP if practical
- Use original filenames when possible
- Output pretty-printed JSON
- Ensure export output is valid and Flutter-ARB compatible

UX requirements:

- Modern, clean, practical UI
- Include a top toolbar with:
  - upload button
  - search input
  - grouping toggle
  - expand/collapse all groups
  - download all button
- Optional left sidebar:
  - list of groups
  - counts
  - quick navigation
- Main content is the editable translation table
- Metadata should expand inline below the main row
- Highlight rows with metadata subtly, not aggressively
- Show a helpful empty state before upload
- Show parse/validation errors clearly
- Make the UI good enough for a real internal demo

Data model expectations:
Use clear internal types such as:

- ArbLocaleFile
- TranslationEntry
- MetadataEntry
- GroupedTranslationEntry

Suggested data concepts:

- locale
- filename
- raw arb content
- translation key
- translation value by locale
- metadata by key
- computed group
- missing locales

Separate concerns clearly:

- parsing
- validation
- grouping
- editing state
- exporting

Suggested project structure:

- `app/`
- `components/`
  - `arb-editor.tsx`
  - `arb-upload.tsx`
  - `translation-table.tsx`
  - `metadata-editor.tsx`
  - `group-sidebar.tsx`
  - `toolbar.tsx`
- `lib/`
  - `arb-parser.ts`
  - `arb-exporter.ts`
  - `grouping.ts`
  - `types.ts`
  - `validation.ts`
- `hooks/`
  - custom hooks for editor state if needed

Implementation details:

Parsing:

- Parse uploaded JSON safely
- Separate:
  - special keys like `@@locale`
  - translation keys
  - metadata keys beginning with `@`
- Match `@key` to `key`
- Preserve unknown extra ARB-compatible fields when reasonable

Editing:

- Editing a translation cell should update only that locale/key pair
- Editing a missing translation should create the value automatically
- Editing metadata should update the linked metadata object
- Keep all state changes reactive and predictable

Exporting:
For each locale export:

- Include `@@locale`
- Include all translation keys for that locale
- Include metadata keys in proper ARB format using `@key`
- Preserve valid JSON structure
- Pretty-print output

Nice-to-have features if practical:

- Add new translation key
- Add new locale column manually
- Highlight missing translations
- Duplicate key warning
- Raw JSON preview per locale
- Merge mode vs replace mode on import
- Virtualized table if row count is large
- ZIP export for all ARB files

Code quality requirements:

- Use strict TypeScript
- Avoid monolithic components
- Keep functions small and reusable
- Add comments for important logic, especially grouping, parsing, metadata linking, and exporting
- Do not leave major TODOs or placeholders
- Prefer real implementations over mockups
- Make the project runnable locally
- Ensure the demo works without a backend

Important notes:

- This is specifically an ARB editor for Flutter localization workflows
- Metadata keys follow ARB conventions such as `@my_key`
- Grouping is a major feature and must not be implemented as a naive first-prefix grouping
- The UI must prioritize clarity for developers/translators working with multiple locale files

Execution instructions:

- First plan the architecture and list the files you will create
- Then generate the full code file by file
- Make the implementation complete and runnable
- Do not skip difficult parts like grouping or export logic
- For the grouping utility, implement real scoring logic rather than pseudo-code
- Keep the UI polished enough for a convincing demo
- Output complete code, not just explanations

Deliverables:

1. Full Next.js app code
2. Modular reusable components
3. ARB parsing and validation logic
4. Smart prefix grouping algorithm
5. Metadata editing UI
6. Export/download logic
7. Sample data or an easy way to test via file upload
