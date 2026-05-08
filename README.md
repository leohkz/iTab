# iTab — Workspace New Tab

> A beautiful, productivity-focused Chrome Extension that replaces your new tab page with a fully customisable workspace — inspired by macOS and iPadOS design.

Built with **React · TypeScript · Tailwind CSS · Vite · Manifest V3**

---

## Install from Release (Recommended)

1. Go to the [**Releases**](https://github.com/leohkz/iTab/releases) page and download the latest `iTab-vX.X.X.zip`
2. Unzip to any folder
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** → select the unzipped folder
6. Open a new tab — iTab replaces the default new tab page

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
- **Apps pinned to the Dock are hidden from the App Grid** (true iPadOS behaviour)

### 🖥 macOS-style Top Bar & Dock
- Glassmorphism top bar with Space switcher
- Floating Dock with pinned apps and recent tabs
- Drag any app shortcut onto the Dock to pin it; removing from Dock restores it to the App Grid

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

### 🤖 AI Portal Bar
- Quick-access sidebar for AI tools: ChatGPT, Claude, Gemini, Copilot, DeepSeek, Tongyi, and more
- Hover to expand; click any portal to open in a new tab
- Icons loaded via Google Favicon API for accurate branding across all domains
- Fully customisable: reorder, rename, toggle visibility, or add custom AI URLs
- Adjustable button size (S / M / L / XL)

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
- **AI Portals** — manage portal list, icons, and button size
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
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v3 |
| Build tool | Vite 8 |
| Extension | Chrome Manifest V3 |
| Icons | Lucide React |
| Storage | `chrome.storage.local` (extension) / in-memory (dev) |

---

## Getting Started (Development)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
npm run build
```

### Load as Chrome Extension (from source)

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the generated `dist/` folder
6. Open a new tab — iTab will replace the default new tab page

---

## Releasing a New Version

Push a semver tag to trigger the automated release workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will build the extension, zip the `dist/` folder, and publish it to the [Releases](https://github.com/leohkz/iTab/releases) page automatically.

---

## Project Structure

```
src/
├── components/       # UI components (AppGrid, Dock, TopBar, AiPortalBar…)
├── data/             # Mock store and default configuration
├── lib/              # Utility helpers
├── i18n.ts           # Translation dictionary (EN / zh-Hant / zh-Hans)
├── types.ts          # TypeScript interfaces
└── App.tsx           # Root component and state management
```

---

## Licence

MIT

---
---

# iTab — 工作空間新分頁

> 一款美觀、專注於生產力的 Chrome 擴充功能，將你的新分頁替換為完全可自訂的工作空間——靈感來自 macOS 與 iPadOS 的設計語言。

技術棧：**React · TypeScript · Tailwind CSS · Vite · Manifest V3**

---

## 從 Release 安裝（推薦）

1. 前往 [**Releases**](https://github.com/leohkz/iTab/releases) 頁面，下載最新的 `iTab-vX.X.X.zip`
2. 解壓縮到任意資料夾
3. 開啟 Chrome → `chrome://extensions/`
4. 右上角開啟**開發人員模式**
5. 點擊**載入未封裝項目** → 選擇解壓縮後的資料夾
6. 開啟新分頁——iTab 將取代預設新分頁

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
- **已釘選至 Dock 的應用不再顯示於應用格線**（真實 iPadOS 行為）

### 🖥 macOS 風格頂部列與 Dock
- 玻璃擬態頂部列，內含空間切換器
- 浮動 Dock 列，顯示已釘選的應用與最近分頁
- 將任何應用捷徑拖曳至 Dock 即可釘選；從 Dock 移除後自動回到應用格線

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

### 🤖 AI 入口側欄
- 快速存取 AI 工具：ChatGPT、Claude、Gemini、Copilot、DeepSeek、通義千問等
- 滑鼠懸停展開；點擊任意入口在新分頁開啟
- 圖示透過 Google Favicon API 載入，所有域名（包括中國網站）均正確顯示
- 完全可自訂：重新排序、重新命名、切換顯示、新增自訂 AI 網址
- 可調整按鈕大小（S / M / L / XL）

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
- **AI 入口** — 管理入口清單、圖示與按鈕大小
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
| 框架 | React 19 + TypeScript |
| 樣式 | Tailwind CSS v3 |
| 建置工具 | Vite 8 |
| 擴充功能 | Chrome Manifest V3 |
| 圖示庫 | Lucide React |
| 資料儲存 | `chrome.storage.local`（擴充功能模式）/ 記憶體（開發模式）|

---

## 快速開始（開發環境）

```bash
npm install
npm run dev
```

在瀏覽器開啟 `http://localhost:5173`。

### 建置

```bash
npm run build
```

### 從原始碼載入為 Chrome 擴充功能

1. 執行 `npm run build`
2. 開啟 `chrome://extensions`
3. 右上角開啟**開發人員模式**
4. 點擊**載入未封裝項目**
5. 選擇產生的 `dist/` 資料夾
6. 開啟新分頁——iTab 將取代預設新分頁

---

## 發布新版本

推送 semver tag 即可觸發自動 Release 流程：

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 會自動建置擴充功能、將 `dist/` 壓縮為 zip，並發布至 [Releases](https://github.com/leohkz/iTab/releases) 頁面。

---

## 專案結構

```
src/
├── components/       # UI 元件（AppGrid、Dock、TopBar、AiPortalBar…）
├── data/             # 模擬資料與預設設定
├── lib/              # 工具函式
├── i18n.ts           # 翻譯字典（英文 / 繁中 / 簡中）
├── types.ts          # TypeScript 介面定義
└── App.tsx           # 根元件與狀態管理
```

---

## 授權

MIT
