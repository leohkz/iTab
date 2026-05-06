# iTab — Workspace New Tab

> A beautiful, productivity-focused Chrome Extension that replaces your new tab page with a fully customisable workspace — inspired by macOS and iPadOS design.

Built with **React · TypeScript · Tailwind CSS · Vite · Manifest V3**

---

## Features

### 🗂 Spaces
- Create multiple independent workspaces (e.g. Work, Personal, Study)
- Each Space has its own app shortcuts, folders, and layout
- Folders are space-scoped — a folder created in Work will not appear in Personal

### 📱 App Grid
- iPadOS-style app grid with customisable columns and rows
- Enter edit/jiggle mode via right-click or long press (no permanent Edit button)
- Add, rename, and delete shortcuts in edit mode
- Drag to reorder shortcuts or drag one onto another to group them into a folder
- Drag shortcuts out of folders back to the main grid
- Folder modal opens on click; closes by clicking outside

### 🌐 Website Shortcuts
- Add any website with a name, URL, and optional custom icon URL
- Icons load automatically via the Google Favicon API with a monogram fallback
- Optional icon colour — leaving it blank auto-matches the favicon accent colour

### 📁 Folders
- iPadOS-style folder previews with a 2×2 website thumbnail grid
- Rename or delete folders in edit mode
- Each folder belongs to the space it was created in

### 🔍 Spotlight Search
- macOS Spotlight-style search modal (`Cmd / Ctrl + K`)
- Search across all your shortcuts or the web directly
- Multiple search engines: Google, Bing, DuckDuckGo, Perplexity, YouTube, Google Maps
- Add custom search engines with `{q}` placeholder; enable or disable per engine

### 🖥 macOS-style Top Bar & Dock
- Glassmorphism top bar with Space switcher
- Floating Dock with pinned apps and recent tabs
- Drag any app shortcut onto the Dock to pin it

### 🎨 Appearance & Themes
- Three macOS-inspired gradient themes: Sonoma, Ventura, Slate
- Adjustable glass blur intensity
- Right-click anywhere or use the top bar to toggle edit mode

### 🧩 Widgets
- Sticky quick notes
- To-do list with check-off
- Pomodoro countdown timer

### 📚 Prompt Library
- Save, organise, and reuse AI prompts
- Tag prompts with custom colour labels
- Attach an image and scope prompts to a specific Space

### ⚙️ Settings
- **Appearance** — theme, glass intensity
- **Layout** — grid columns and rows
- **Search** — default engine, custom engines
- **Bookmarks** — sync Chrome bookmarks (extension mode) or preview import (dev mode)
- **Data** — export JSON, import JSON, reset to defaults
- **Experiments** — smart recommendations, recent visits, keyboard shortcuts, conflict warnings

### 🌍 Internationalisation
- UI fully translated in English, Traditional Chinese, and Simplified Chinese
- Language can be switched from Settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v3 |
| Build tool | Vite |
| Extension | Chrome Manifest V3 |
| Icons | Lucide React |
| Storage | `chrome.storage.local` (extension) / in-memory (dev) |

---

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
npm run build
```

### Load as Chrome Extension

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the generated `dist/` folder
6. Open a new tab — iTab will replace the default new tab page

---

## Project Structure

```
src/
├── components/       # UI components (AppGrid, Dock, TopBar, ShortcutEditor…)
├── data/             # Mock store and default configuration
├── lib/              # Utility helpers
├── i18n.ts           # Translation dictionary (EN / zh-Hant / zh-Hans)
├── types.ts          # TypeScript interfaces
└── App.tsx           # Root component and state management
```

---

## Data Model

```ts
interface Folder {
  id: string;
  name: string;
  color?: string;
  spaceId?: string;   // bound to a specific Space; undefined = visible in all Spaces
}

interface AppShortcut {
  id: string;
  name: string;
  url: string;
  folderId: string | null;
  spaceId?: string;
  iconType: 'api' | 'monogram' | 'custom';
  iconValue: string;
  iconColor?: string;
}

interface Space {
  id: string;
  name: string;
  accent: string;     // Tailwind gradient class for the Space badge
}
```

---

## Adding a Translation

Add or update labels in `src/i18n.ts`. The UI uses stable translation keys so new locales can be added without touching any component logic.

---

## Licence

MIT

---

---

# iTab — 工作空間新分頁

> 一款美觀、專注於生產力的 Chrome 擴充功能，將你的新分頁替換為完全可自訂的工作空間——靈感來自 macOS 與 iPadOS 的設計語言。

技術棧：**React · TypeScript · Tailwind CSS · Vite · Manifest V3**

---

## 功能介紹

### 🗂 空間（Spaces）
- 建立多個獨立工作空間（例如：工作、個人、學習）
- 每個空間擁有各自的應用捷徑、文件夾與版面配置
- 文件夾綁定所屬空間——在「工作」空間建立的文件夾不會出現在「個人」空間

### 📱 應用程式格線
- 仿 iPadOS 風格的應用格線，欄數與列數皆可自訂
- 透過右鍵點擊或長按進入抖動編輯模式（無常駐「編輯」按鈕）
- 在編輯模式下可新增、重新命名及刪除捷徑
- 拖曳可重新排序；將一個圖示拖曳到另一個上方可自動建立文件夾
- 可將捷徑從文件夾拖曳回主格線
- 點擊文件夾開啟；點擊外部區域關閉

### 🌐 網站捷徑
- 可為任何網站新增名稱、網址及自訂圖示 URL
- 圖示透過 Google Favicon API 自動載入，若無則顯示字母縮寫
- 可選填圖示顏色——留空則自動比對 favicon 的主色調

### 📁 文件夾
- 仿 iPadOS 風格的文件夾預覽，以 2×2 縮圖排列呈現
- 在編輯模式下可重新命名或刪除文件夾
- 每個文件夾屬於建立時所在的空間

### 🔍 Spotlight 搜尋
- 仿 macOS Spotlight 風格的搜尋介面（`Cmd / Ctrl + K`）
- 可搜尋全部捷徑，或直接以各搜尋引擎查詢網頁
- 內建多款搜尋引擎：Google、Bing、DuckDuckGo、Perplexity、YouTube、Google 地圖
- 支援自訂搜尋引擎（使用 `{q}` 作為查詢佔位符）；可單獨啟用或停用

### 🖥 macOS 風格頂部列與 Dock
- 玻璃擬態頂部列，內含空間切換器
- 浮動 Dock 列，顯示已釘選的應用與最近分頁
- 將任何應用捷徑拖曳至 Dock 即可釘選

### 🎨 外觀與主題
- 三款仿 macOS 漸層主題：Sonoma、Ventura、Slate
- 可調整玻璃模糊強度
- 在任意位置右鍵，或透過頂部列切換編輯模式

### 🧩 小工具
- 即時便條（快速筆記）
- 待辦事項清單（可勾選完成）
- 番茄鐘倒計時

### 📚 Prompt 資料庫
- 儲存、整理並重複使用 AI 提示詞
- 以自訂顏色標籤分類
- 可附加圖片，並將 Prompt 限定於特定空間顯示

### ⚙️ 設定
- **外觀** — 主題、玻璃模糊強度
- **版面** — 格線欄數與列數
- **搜尋** — 預設引擎、自訂搜尋引擎
- **書籤** — 同步 Chrome 書籤（擴充功能模式）或預覽匯入（開發模式）
- **資料** — 匯出 JSON、匯入 JSON、重設預設值
- **實驗功能** — 智慧推薦、最近瀏覽、鍵盤捷徑、衝突警告

### 🌍 多語言支援
- 介面完整翻譯：英文、繁體中文、簡體中文
- 可在設定中切換語言

---

## 技術棧

| 層級 | 技術 |
|---|---|
| 框架 | React 18 + TypeScript |
| 樣式 | Tailwind CSS v3 |
| 建置工具 | Vite |
| 擴充功能 | Chrome Manifest V3 |
| 圖示庫 | Lucide React |
| 資料儲存 | `chrome.storage.local`（擴充功能模式）/ 記憶體（開發模式）|

---

## 快速開始

### 開發環境

```bash
npm install
npm run dev
```

在瀏覽器開啟 `http://localhost:5173`。

### 建置

```bash
npm run build
```

### 載入為 Chrome 擴充功能

1. 執行 `npm run build`
2. 開啟 `chrome://extensions`
3. 右上角開啟**開發人員模式**
4. 點擊**載入未封裝項目**
5. 選擇產生的 `dist/` 資料夾
6. 開啟新分頁——iTab 將取代預設新分頁

---

## 專案結構

```
src/
├── components/       # UI 元件（AppGrid、Dock、TopBar、ShortcutEditor…）
├── data/             # 模擬資料與預設設定
├── lib/              # 工具函式
├── i18n.ts           # 翻譯字典（英文 / 繁中 / 簡中）
├── types.ts          # TypeScript 介面定義
└── App.tsx           # 根元件與狀態管理
```

---

## 資料模型

```ts
interface Folder {
  id: string;
  name: string;
  color?: string;
  spaceId?: string;   // 綁定特定空間；未設定則在所有空間顯示
}

interface AppShortcut {
  id: string;
  name: string;
  url: string;
  folderId: string | null;
  spaceId?: string;
  iconType: 'api' | 'monogram' | 'custom';
  iconValue: string;
  iconColor?: string;
}

interface Space {
  id: string;
  name: string;
  accent: string;     // 空間徽章的 Tailwind 漸層 class
}
```

---

## 新增翻譯語言

在 `src/i18n.ts` 中新增或修改翻譯詞條。介面使用穩定的翻譯鍵名，新增語言無需修改任何元件邏輯。

---

## 授權

MIT
