# iTab

> 為 Chrome 打造的 macOS 風格新分頁擴充功能 — 內建 Spotlight 搜尋、AI 入口、提示詞庫、多 Space 應用格、專注音效以及 GitHub Gist 同步。

**[English README →](README.md)**

---

## ✨ 功能特色

### 🗂 應用格與 Space
- 將捷徑分類到多個 **Space**（類似虛擬桌面），每個 Space 有獨立的強調色
- **拖放**重新排列 App，或將它們收納進**資料夾**
- 左右滑動（或點擊頁面指示點）切換頁面
- 可自訂格子的欄數與列數

### 🔍 Spotlight 搜尋
- 按 `/` 或點擊搜尋欄，開啟仿 macOS Spotlight 的搜尋面板
- 淺色磨砂玻璃介面，即時搜尋 App、待辦、筆記與提示詞
- 鍵盤捷徑切換搜尋引擎（例如 `g ` 切換為 Google、`yt ` 切換為 YouTube）
- 支援自訂搜尋引擎 URL 範本
- 記錄近期搜尋紀錄，方便快速重複搜尋

### 🤖 AI 入口
- 從頂部浮動列一鍵開啟 ChatGPT、Claude、Gemini、Perplexity 等
- 完全可設定 — 新增、移除、排序、調整入口按鈕大小
- Popup 快速啟動：直接從 Chrome 工具列圖示開啟任意 AI 入口

### 📚 提示詞庫
- 儲存、標記並搜尋你常用的 AI 提示詞
- 縮圖預覽，一鍵複製
- 無需開新分頁，直接在 Popup 中存取整個提示詞庫
- 在任何網頁右鍵選取文字 → **注入提示詞** 快速填入輸入框

### 🎵 專注音效
- 內建多種環境音效：雨聲、咖啡廳、森林、白噪音等
- 番茄鐘風格計時器，支援自訂預設時間
- 每個音效層獨立音量控制

### 🧩 小工具
- 時鐘、日期、天氣等一覽無遺
- 在 **設定 → 版面** 中隨時開啟或關閉各小工具

### ☁️ GitHub Gist 同步
- 將全部設定（App、Space、提示詞、偏好設定）備份或還原至私人 GitHub Gist
- OAuth Device Flow 登入，無需手動複製 Token
- 支援每次設定變更時自動同步

### 🎨 主題與外觀
- 三款內建主題：**Sonoma**、**Ventura**、**Slate**
- 可調整應用格背景的玻璃/模糊強度
- 語言支援：English · 繁體中文 · 简体中文

### ⌨️ 鍵盤捷徑

| 捷徑 | 功能 |
|---|---|
| `/` | 開啟 Spotlight 搜尋 |
| `Alt + Shift + I` | 開啟 iTab Popup |
| `Esc` | 關閉視窗 / 搜尋 |

---

## 🚀 安裝方式

### 從 Release 安裝（推薦）

1. 從 [Releases](https://github.com/leohkz/iTab/releases) 下載最新的 `iTab-vX.X.X.zip`
2. 解壓縮到任意資料夾
3. 開啟 Chrome → `chrome://extensions/`
4. 開啟右上角的**開發者模式**
5. 點擊**載入未封裝項目** → 選擇解壓縮後的資料夾
6. 開新分頁 — iTab 已啟動 ✓

### 從原始碼建置

```bash
# 1. 複製儲存庫
git clone https://github.com/leohkz/iTab.git
cd iTab

# 2. 安裝相依套件
npm install

# 3. 建置
npm run build
```

接著將 `dist/` 資料夾以未封裝項目方式載入（同上方步驟 3–6）。

### 開發模式（熱重載）

```bash
npm run dev
```

> **注意：** Vite 開發伺服器僅供元件開發使用。若需測試完整擴充功能行為（storage、tabs API、popup），請載入建置後的 `dist/` 資料夾。

---

## 🗃 專案結構

```
src/
├── components/
│   ├── AppGrid.tsx            # 主應用格：拖放排序與頁面滑動
│   ├── AiPortalBar.tsx        # 頂部 AI 入口列
│   ├── Dock.tsx               # macOS 風格底部 Dock
│   ├── FocusSound.tsx         # 環境音效播放器 + 計時器
│   ├── PromptLibrary.tsx      # 提示詞庫：格狀展示 / 搜尋 / 預覽
│   ├── PromptEditor.tsx       # 新增與編輯提示詞
│   ├── SettingsModal.tsx      # 完整設定面板（8 個分類）
│   ├── SpotlightSearch.tsx    # Spotlight 搜尋面板（淺色主題）
│   ├── TextSelectionMenu.tsx  # 右鍵注入提示詞
│   ├── TopBar.tsx             # 時鐘、日期、Space 切換器
│   └── Widgets.tsx            # 小工具集合
├── lib/
│   └── gistSync.ts            # GitHub Gist 備份 / 還原邏輯
├── popup.tsx                  # Chrome 工具列 Popup（提示詞 + AI）
├── background.ts              # Service Worker（右鍵選單、自動同步）
├── content.ts                 # Content Script（文字選取選單）
├── i18n.ts                    # 多語系翻譯（en / zh-Hant / zh-Hans）
└── types.ts                   # 共用 TypeScript 型別
public/
├── manifest.json              # Chrome Extension Manifest v3
└── icon*.png / icon.svg       # 擴充功能圖示
```

---

## ⚙️ 技術棧

| 層級 | 技術 |
|---|---|
| UI 框架 | React 19 + TypeScript 6 |
| 樣式 | Tailwind CSS v3 |
| 動畫 | GSAP 3 |
| 拖放 | dnd-kit |
| 建置工具 | Vite 8 |
| 擴充功能 API | Chrome MV3（storage、tabs、contextMenus、bookmarks）|
| 同步 | GitHub Gist REST API（OAuth Device Flow）|
| 圖示 | Lucide React |

---

## 🔒 權限說明

| 權限 | 用途 |
|---|---|
| `storage` | 在本機儲存設定、提示詞與 App 資料 |
| `tabs` | 從 Popup / Dock 在新分頁開啟連結 |
| `bookmarks` | 將書籤匯入為捷徑（選用）|
| `contextMenus` | 右鍵選單 → 注入提示詞到任意輸入框 |
| `host_permissions: <all_urls>` | 在任何網頁啟用文字選取選單 |

---

## 📦 打包發布

```bash
npm run build
# 輸出 → dist/
# 壓縮 dist/ 資料夾後上傳至 Chrome Web Store
```

---

## 🛠 貢獻方式

1. Fork 此儲存庫
2. 建立功能分支：`git checkout -b feat/your-feature`
3. 提交時附上清楚的 commit 訊息
4. 發起 Pull Request

---

## 📄 授權

MIT © [leohkz](https://github.com/leohkz)
