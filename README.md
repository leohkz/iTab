# Workspace New Tab

A highly aesthetic Chrome Extension new-tab override built with React, TypeScript, Tailwind CSS, Vite, and Manifest V3. The design language blends a macOS-style menu bar and dock with an iPadOS-style app grid.

## Features

- Manifest V3 new-tab override via `chrome_url_overrides`
- Permissions prepared for `storage`, `bookmarks`, and `tabs`
- Glassmorphism top bar and floating dock
- Locally bundled font assets for Chrome Extension compatibility
- Mock relational data model for folders and app shortcuts
- Default apps: ChatGPT, Notion, YouTube, Gmail, Perplexity, Figma, and more
- Google Favicon API icon loading with monogram fallback
- Custom icon URL and optional icon color per shortcut; leaving color blank uses an automatic favicon-style accent
- iPadOS-style folder previews with centered 2x2 website thumbnails
- Folder modal opens in normal and edit mode, closes by clicking outside, and has no internal X button
- Edit/jiggle mode is entered via right-click or long press; there is no permanent Edit button
- In edit mode: delete, rename, add shortcuts, drag reorder, drag into folders, drag out of folders, and drag onto Dock to pin
- macOS Spotlight-style search modal with `Cmd/Ctrl + K`
- Search engine templates with `{q}` placeholder, enable/disable toggles, and custom engine creation
- Default search engines include Google, Bing, DuckDuckGo, Perplexity, YouTube, and Google Maps
- Dock contains pinned apps and recent apps; invalid quick-action placeholders have been removed
- macOS System Settings-style modal with working Appearance, Layout, Search, Bookmarks, Data, and Experiments categories
- Appearance controls update theme and glass intensity
- Layout controls allow user-selected grid columns and rows
- Bookmarks sync imports Chrome bookmarks when installed as an extension, with a preview import in dev mode
- Data controls support export JSON, import JSON, and reset defaults with confirmation
- Widgets include a to-do list, Pomodoro countdown timer, and quick notes
- i18n dictionary supports English, Traditional Chinese, and Simplified Chinese in `src/i18n.ts`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Load in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the generated `dist` folder.

## Data Model

```ts
interface Folder {
  id: string;
  name: string;
  color?: string;
}

interface AppShortcut {
  id: string;
  name: string;
  url: string;
  folderId: string | null;
  iconType: 'api' | 'monogram' | 'custom';
  iconValue: string;
  iconColor?: string;
}
```

## Translation

Add or update labels in `src/i18n.ts`. The UI uses stable translation keys so future contributors can add locales without touching component logic.

## QA

The current production build was validated with Playwright against `vite preview` for:

- folder open/close by outside click
- edit mode through right-click and icon jiggle state
- folder editing while in edit mode
- Settings Appearance/Layout/Search/Experiments interactions
- custom search engine creation
- Spotlight opening with `Ctrl/Cmd + K`
- widgets, to-do creation, and Pomodoro countdown
