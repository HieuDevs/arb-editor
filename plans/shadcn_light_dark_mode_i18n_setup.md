Use **shadcn/ui** as the primary UI system for the entire app.

Also add the following platform-level requirements:

- Support both **light mode and dark mode**
- Support **UI localization / internationalization** for the editor itself
- The app should feel polished and complete in both themes and across supported UI languages

UI implementation requirements:

- Use shadcn/ui components wherever appropriate instead of building basic UI primitives from scratch
- Keep the UI clean, modern, and consistent
- Use Tailwind CSS together with shadcn/ui styling conventions
- Prefer accessible, keyboard-friendly components

Please implement the UI with shadcn/ui using components such as:

- `Button`
- `Input`
- `Textarea`
- `Card`
- `Badge`
- `Table`
- `Tabs`
- `Dialog`
- `DropdownMenu`
- `Accordion`
- `Collapsible`
- `ScrollArea`
- `Separator`
- `Tooltip`
- `Sheet`
- `Checkbox`
- `Select`
- `Alert`
- `Skeleton` where useful
- `Toast` / `Sonner` for success and error feedback
- `Switch` for theme toggle and other boolean settings

Specific UI expectations with shadcn:

- Build the top toolbar using shadcn components for upload, search, grouping toggle, expand/collapse all, theme toggle, language switcher, and download actions
- Build the main translation editor using a polished table layout styled with shadcn patterns
- Use `Card` containers to structure the page
- Use `Badge` or subtle status indicators for metadata presence, missing translations, and locale labels
- Use `Collapsible` or `Accordion` for expanding metadata editors inline under each key row
- Use `Dialog` or `Sheet` for advanced actions such as raw JSON preview, bulk import behavior, or full metadata editing if needed
- Use `ScrollArea` for large tables or side panels
- Use `Tooltip` for metadata hints, validation hints, and compact action explanations
- Use `Alert` for parse errors, duplicate locale warnings, and invalid metadata feedback
- Use `Tabs` if a split view or per-locale raw preview is added
- Use `DropdownMenu` for row actions or export options
- Use `Skeleton` states when rendering or processing uploaded data if necessary

Dark / light mode requirements:

- Implement proper theme switching with **light mode**, **dark mode**, and ideally **system theme**
- Use `next-themes` for theme management
- Add a visible theme toggle in the toolbar
- Ensure all core screens work correctly in both themes:
  - upload area
  - toolbar
  - group sidebar
  - translation table
  - metadata editor
  - dialogs / sheets / dropdowns / tooltips
- Ensure contrast, borders, hover states, muted text, badges, alerts, and highlighted metadata rows all look good in both light and dark themes
- Do not hardcode colors in a way that breaks shadcn theming
- Follow shadcn theme token conventions and Tailwind semantic utility usage
- Keep metadata highlighting subtle in both themes

Localization / internationalization requirements:

- The editor UI itself must support localization
- Use a proper i18n solution suitable for Next.js App Router, such as `next-intl`
- Support at least:
  - English
  - Vietnamese
- Structure the app so adding more UI languages later is easy
- Externalize all user-facing UI strings, including:
  - toolbar labels
  - buttons
  - placeholders
  - table headers
  - validation messages
  - empty states
  - dialogs
  - metadata labels
  - download/import messages
  - theme labels
  - grouping labels
- Add a language switcher in the toolbar or settings area
- The selected UI language should update visible interface text cleanly
- Keep ARB translation content separate from app UI localization logic
- Do not confuse:
  - app UI locale
  - uploaded ARB locales being edited
- Make it clear in the UX that:
  - one locale controls the editor interface language
  - other locales are the uploaded translation file columns

Design direction:

- Make the app feel like a polished internal tool
- Keep spacing, typography, hover states, and borders aligned with shadcn/ui design patterns
- Use subtle highlighting for keys with metadata
- Keep the table dense enough for productivity, but still readable
- Ensure the layout feels professional and not like a rough prototype
- Make both light and dark mode visually balanced

Implementation details:

- Set up shadcn/ui correctly in the Next.js project
- Install and configure only the components actually needed
- Keep components reusable and composable
- Do not overcomplicate styling when a standard shadcn pattern already works well
- Use icons from `lucide-react` where useful for metadata, upload, download, expand/collapse, search, warnings, locale actions, theme toggle, and language switcher
- Organize translation message files clearly, for example by locale
- Keep theme logic and i18n logic modular and easy to maintain

Important:

- The app should not just “include shadcn”; it should clearly be built around shadcn/ui patterns and components
- The app should not just “have dark mode”; it should be fully usable and polished in both light and dark themes
- The app should not just “have localization”; all interface strings should be properly internationalized
- Keep the UX practical for editing many translation keys across multiple locales
- Favor consistency and usability over flashy visuals
