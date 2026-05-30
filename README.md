# iTab

> A macOS & iPadOS-inspired new tab experience for Chrome — with AI portals, prompt library, spotlight search, focus sounds, and GitHub Gist sync.

---

## ✨ Features

### 🗂 App Grid & Spaces
- Organise shortcuts into multiple **Spaces** (like virtual desktops), each with its own accent colour
- Drag-and-drop to reorder apps; group them into **folders**
- Customisable grid size (columns × rows)

### 🔍 Spotlight Search
- Press `/` or click the search bar to open a macOS Spotlight-style search
- Switch search engines on the fly with shortcuts (e.g. `g` for Google, `yt` for YouTube)
- Add custom search engines with your own URL templates

### 🤖 AI Portals
- One-click access to ChatGPT, Claude, Gemini, Perplexity, and more from a floating top bar
- Fully configurable — add, remove, reorder, and resize portal buttons
- Popup quick-launch: open any AI portal directly from the Chrome toolbar icon

### 📚 Prompt Library
- Save, tag, and search your favourite AI prompts
- Thumbnail preview with one-click copy
- Access your entire prompt library from the popup without opening a new tab

### 🎵 Focus Sounds
- Built-in ambient soundscapes (rain, café, forest, white noise…)
- Timer with Pomodoro-style presets
- Volume control per sound layer

### 🧩 Widgets
- Clock, date, weather, and more at a glance
- Toggle widgets on/off in Settings → Layout

### ☁️ GitHub Gist Sync
- Back up and restore your entire configuration (apps, prompts, settings) to a private GitHub Gist
- OAuth Device Flow login — no tokens to copy manually
- Optional auto-sync on every config change

### 🎨 Themes & Appearance
- Three built-in themes: **Sonoma**, **Ventura**, **Slate**
- Adjustable glass/blur intensity for the app grid backdrop
- Language support: English · 繁體中文 · 简体中文

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Alt + Shift + I` | Open iTab popup |
| `/` | Open Spotlight search |
| `Esc` | Close modal / search |

---

## 🚀 Getting Started

### Install from source

```bash
# 1. Clone the repo
git clone https://github.com/leohkz/iTab.git
cd iTab

# 2. Install dependencies
npm install

# 3. Build
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder
4. Open a new tab — iTab is live ✓

### Development (hot reload)

```bash
npm run dev
```

> Note: Vite dev server is for component development only. For full extension behaviour (storage, tabs API, popup), always load the built `dist/` folder.

---

## 🗃 Project Structure

```
src/
├── components/
│   ├── AppGrid.tsx          # Main shortcut grid with drag-and-drop
│   ├── AiPortalBar.tsx      # Top AI portal strip
│   ├── Dock.tsx             # macOS-style bottom dock
│   ├── FocusSound.tsx       # Ambient sound player + timer
│   ├── PromptLibrary.tsx    # Prompt grid / search / preview
│   ├── PromptEditor.tsx     # Create & edit prompts
│   ├── SettingsModal.tsx    # Full settings panel (8 categories)
│   ├── SpotlightSearch.tsx  # Search overlay
│   ├── TextSelectionMenu.tsx# Right-click prompt injection
│   ├── TopBar.tsx           # Clock, date, space switcher
│   └── Widgets.tsx          # Widget collection
├── lib/
│   └── gistSync.ts          # GitHub Gist backup/restore logic
├── popup.tsx                # Chrome toolbar popup (Prompts + AI)
├── background.ts            # Service worker (context menus, auto-sync)
├── content.ts               # Content script (text selection menu)
├── i18n.ts                  # Translations (en / zh-Hant / zh-Hans)
└── types.ts                 # Shared TypeScript types
public/
├── manifest.json            # Chrome Extension Manifest v3
└── icon*.png / icon.svg     # Extension icons
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v3 |
| Build | Vite 5 |
| Extension API | Chrome MV3 (storage, tabs, contextMenus, bookmarks) |
| Sync | GitHub Gist REST API (OAuth Device Flow) |
| Icons | Lucide React |

---

## 🔒 Permissions

| Permission | Why |
|---|---|
| `storage` | Save config, prompts, and app data locally |
| `tabs` | Open links in new tabs from popup / dock |
| `bookmarks` | Import bookmarks as shortcuts (optional) |
| `contextMenus` | Right-click → inject prompt into text field |
| `host_permissions: <all_urls>` | Enable text-selection menu on any website |

---

## 📦 Building for distribution

```bash
npm run build
# Output → dist/
# Zip the dist/ folder and upload to Chrome Web Store
```

---

## 🛠 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with a clear message
4. Open a Pull Request

---

## 📄 License

MIT © [leohkz](https://github.com/leohkz)
