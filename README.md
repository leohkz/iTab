# iTab — Workspace New Tab

> A beautiful, productivity-focused Chrome Extension that replaces your new tab page with a fully customisable workspace — inspired by macOS and iPadOS design.

**[🌐 Live Demo](https://leohkz.github.io/itab/)** &nbsp;·&nbsp; **[📦 Download Latest Release](https://github.com/leohkz/iTab/releases)** &nbsp;·&nbsp; **[⭐ Star on GitHub](https://github.com/leohkz/iTab)**

> **⚠️ Demo Notice:** The live demo runs as a web page. Chrome extension APIs (`chrome.storage`, bookmarks, tabs) are unavailable — Cloud Sync login will not work. All other UI and features are fully functional in the preview.

Built with **React · TypeScript · Tailwind CSS · Vite · Manifest V3**

---

## ✨ Features

### 🗂 Spaces
- Multiple independent workspaces (Work, Personal, Study, etc.)
- Each Space has its own app shortcuts, folders, and layout
- Folders are space-scoped — clean separation between contexts

### 📱 App Grid
- iPadOS-style icon grid with customisable columns and rows
- Long press or right-click to enter jiggle edit mode
- Drag to reorder; drag one icon onto another to create a folder
- Apps pinned to Dock are hidden from the grid (true iPadOS behaviour)

### 🖥 Top Bar & Dock
- Glassmorphism top bar with Space switcher
- Floating Dock with pinned apps
- Drag any shortcut to the Dock to pin it; removing restores it to the grid

### 🔍 Spotlight Search
- `Cmd / Ctrl + K` to open
- Search across shortcuts or the web directly
- Built-in engines: Google, Bing, DuckDuckGo, Perplexity, YouTube, Google Maps
- Add fully custom search engines with `{q}` placeholder

### 🤖 AI Portal Bar
- One-click access to ChatGPT, Claude, Gemini, Copilot, DeepSeek, and more
- Hover to expand; fully customisable list and button sizes (S / M / L / XL)

### ☁️ Cloud Sync (GitHub Gist)
- Sign in with GitHub using **Device Flow** — no password required
- Backup and restore all settings via a private GitHub Gist
- Auto-detects existing backup when signing in from a new browser
- Optional auto-sync on every change

### 🎨 Appearance & Themes
- Three macOS-inspired themes: **Sonoma**, **Ventura**, **Slate**
- Adjustable glassmorphism blur intensity

### 🧩 Widgets
- Sticky quick notes
- To-do list with check-off
- Pomodoro countdown timer

### 📚 Prompt Library
- Save, organise, and copy AI prompts
- Custom colour tags and preview images
- Scoped per Space

### 🌍 Internationalisation
- Fully translated: **English**, **繁體中文**, **简体中文**

---

## 📦 Install (Recommended)

1. Go to [**Releases**](https://github.com/leohkz/iTab/releases) and download `iTab-vX.X.X.zip`
2. Unzip to any folder
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** → select the unzipped folder
6. Open a new tab — iTab replaces the default new tab page

---

## 🛠 Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
```

### Load from source

1. `npm run build`
2. `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`

### Release a new version

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions automatically builds, zips `dist/`, and publishes to [Releases](https://github.com/leohkz/iTab/releases).

---

## 🗂 Project Structure

```
src/
├── components/   # UI components (AppGrid, Dock, TopBar, AiPortalBar…)
├── data/         # Default config and mock store
├── lib/          # Utilities (gistSync, etc.)
├── i18n.ts       # Translations (EN / zh-Hant / zh-Hans)
├── types.ts      # TypeScript interfaces
└── App.tsx       # Root component and state
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v3 |
| Build | Vite 8 |
| Extension | Chrome Manifest V3 |
| Icons | Lucide React |
| Storage | `chrome.storage.local` (extension) / in-memory (dev) |
| Cloud Sync | GitHub Gist via Device Flow OAuth |

---

## Licence

MIT

---
---

# iTab — 工作空間新分頁

> 一款美觀、專注於生產力的 Chrome 擴充功能，將你的新分頁替換為完全可自訂的工作空間——靈感來自 macOS 與 iPadOS 的設計語言。

**[🌐 線上預覽 Demo](https://leohkz.github.io/itab/)** &nbsp;·&nbsp; **[📦 下載最新版本](https://github.com/leohkz/iTab/releases)** &nbsp;·&nbsp; **[⭐ GitHub](https://github.com/leohkz/iTab)**

> **⚠️ Demo 說明：** 線上預覽以網頁模式運行，Chrome 擴充功能 API（`chrome.storage`、書籤、分頁等）無法使用，**雲端同步登入按鈕將無法運作**。其他所有 UI 介面與功能均可正常展示。

技術棧：**React · TypeScript · Tailwind CSS · Vite · Manifest V3**

---

## ✨ 功能介紹

### 🗂 空間（Spaces）
- 建立多個獨立工作空間（工作、個人、學習等）
- 每個空間擁有各自的應用捷徑、文件夾與版面配置
- 文件夾綁定所屬空間，情境之間完全分離

### 📱 應用程式格線
- 仿 iPadOS 風格的圖示格線，欄數與列數可自訂
- 長按或右鍵進入抖動編輯模式
- 拖曳排序；將圖示拖曳到另一個圖示上自動建立文件夾
- 已釘選至 Dock 的應用不顯示於格線（真實 iPadOS 行為）

### 🖥 頂部列與 Dock
- 玻璃擬態頂部列，內含空間切換器
- 浮動 Dock，顯示已釘選應用
- 拖曳任意捷徑到 Dock 可釘選；移除後自動回到應用格線

### 🔍 Spotlight 搜尋
- `Cmd / Ctrl + K` 開啟
- 搜尋全部捷徑或直接查詢網頁
- 內建引擎：Google、Bing、DuckDuckGo、Perplexity、YouTube、Google 地圖
- 支援自訂搜尋引擎（以 `{q}` 作為查詢佔位符）

### 🤖 AI 入口側欄
- 一鍵存取 ChatGPT、Claude、Gemini、Copilot、DeepSeek 等
- 滑鼠懸停展開；完全可自訂，按鈕大小可調（S / M / L / XL）

### ☁️ 雲端同步（GitHub Gist）
- 透過 **Device Flow** 用 GitHub 登入，無需密碼
- 將所有設定備份至私人 GitHub Gist 並可還原
- 從新瀏覽器登入時自動偵測已有備份
- 可選開啟「變更時自動備份」

### 🎨 外觀與主題
- 三款仿 macOS 漸層主題：**Sonoma**、**Ventura**、**Slate**
- 可調整玻璃模糊強度

### 🧩 小工具
- 即時便條（快速筆記）
- 待辦事項清單（可勾選完成）
- 番茄鐘倒計時

### 📚 Prompt 資料庫
- 儲存、整理並一鍵複製 AI 提示詞
- 自訂顏色標籤與預覽圖片
- 可限定顯示於特定空間

### 🌍 多語言支援
- 完整翻譯：**English**、**繁體中文**、**简体中文**

---

## 📦 安裝方式（推薦）

1. 前往 [**Releases**](https://github.com/leohkz/iTab/releases) 下載最新的 `iTab-vX.X.X.zip`
2. 解壓縮到任意資料夾
3. 開啟 Chrome → `chrome://extensions/`
4. 右上角開啟**開發人員模式**
5. 點擊**載入未封裝項目** → 選擇解壓縮後的資料夾
6. 開啟新分頁——iTab 將取代預設新分頁

---

## 🛠 開發環境

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 輸出至 dist/
```

### 從原始碼載入擴充功能

1. `npm run build`
2. `chrome://extensions` → 開發人員模式 → **載入未封裝項目** → 選擇 `dist/`

### 發布新版本

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 自動建置、壓縮 `dist/` 並發布至 [Releases](https://github.com/leohkz/iTab/releases)。

---

## 🗂 專案結構

```
src/
├── components/   # UI 元件（AppGrid、Dock、TopBar、AiPortalBar…）
├── data/         # 預設設定與模擬資料
├── lib/          # 工具函式（gistSync 等）
├── i18n.ts       # 翻譯字典（英文 / 繁中 / 簡中）
├── types.ts      # TypeScript 介面定義
└── App.tsx       # 根元件與狀態管理
```

---

## 🔧 技術棧

| 層級 | 技術 |
|---|---|
| 框架 | React 19 + TypeScript |
| 樣式 | Tailwind CSS v3 |
| 建置工具 | Vite 8 |
| 擴充功能 | Chrome Manifest V3 |
| 圖示庫 | Lucide React |
| 資料儲存 | `chrome.storage.local`（擴充功能）/ 記憶體（開發模式）|
| 雲端同步 | GitHub Gist，Device Flow OAuth |

---

## 授權

MIT
