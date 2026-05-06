import type { AppConfig, AppShortcut, Folder, SearchEngine, Space } from '../types';

export const spaces: Space[] = [
  { id: 'work', name: 'Work', accent: 'from-sky-200 to-blue-500' },
  { id: 'personal', name: 'Personal', accent: 'from-amber-100 to-orange-400' },
  { id: 'ai', name: 'AI', accent: 'from-cyan-100 to-teal-400' },
  { id: 'content', name: 'Content', accent: 'from-rose-100 to-pink-400' },
];

export const defaultSearchEngines: SearchEngine[] = [
  { id: 'google', name: 'Google', shortcut: 'g', template: 'https://www.google.com/search?q={q}', enabled: true, builtIn: true },
  { id: 'bing', name: 'Bing', shortcut: 'b', template: 'https://www.bing.com/search?q={q}', enabled: true, builtIn: true },
  { id: 'duckduckgo', name: 'DuckDuckGo', shortcut: 'd', template: 'https://duckduckgo.com/?q={q}', enabled: false, builtIn: true },
  { id: 'perplexity', name: 'Perplexity', shortcut: 'p', template: 'https://www.perplexity.ai/search?q={q}', enabled: true, builtIn: true },
  { id: 'youtube', name: 'YouTube', shortcut: 'y', template: 'https://www.youtube.com/results?search_query={q}', enabled: true, builtIn: true },
  { id: 'maps', name: 'Google Maps', shortcut: 'm', template: 'https://www.google.com/maps/search/{q}', enabled: false, builtIn: true },
];

export const folders: Folder[] = [
  { id: 'ai', name: 'AI Desk', color: 'from-cyan-200/80 to-blue-400/80' },
  { id: 'creative', name: 'Creative', color: 'from-amber-100/90 to-orange-300/80' },
  { id: 'reading', name: 'Reading', color: 'from-emerald-100/90 to-teal-300/80' },
  { id: 'shopping', name: 'Shopping', color: 'from-rose-100/90 to-pink-300/80' },
];

// spaceId: undefined = 全域（所有 Space 都顯示）
// spaceId: 'work' | 'personal' | 'ai' | 'content' = 只在指定 Space 顯示
export const shortcuts: AppShortcut[] = [
  // ── Work ──────────────────────────────────────────
  { id: 'notion', name: 'Notion', url: 'https://www.notion.so', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://www.notion.so' },
  { id: 'linear', name: 'Linear', url: 'https://linear.app', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://linear.app' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://github.com' },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://mail.google.com' },
  { id: 'gcal', name: 'Calendar', url: 'https://calendar.google.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://calendar.google.com' },
  { id: 'gdrive', name: 'Drive', url: 'https://drive.google.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://drive.google.com' },
  { id: 'figma', name: 'Figma', url: 'https://www.figma.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://www.figma.com' },
  // ── Personal ──────────────────────────────────────
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', folderId: null, spaceId: 'personal', iconType: 'api', iconValue: 'https://www.youtube.com' },
  { id: 'taobao', name: 'Taobao', url: 'https://www.taobao.com', folderId: 'shopping', spaceId: 'personal', iconType: 'api', iconValue: 'https://www.taobao.com' },
  { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com', folderId: 'shopping', spaceId: 'personal', iconType: 'api', iconValue: 'https://www.amazon.com' },
  { id: 'medium', name: 'Medium', url: 'https://medium.com', folderId: 'reading', spaceId: 'personal', iconType: 'api', iconValue: 'https://medium.com' },
  { id: 'substack', name: 'Substack', url: 'https://substack.com', folderId: 'reading', spaceId: 'personal', iconType: 'api', iconValue: 'https://substack.com' },
  { id: 'readwise', name: 'Readwise', url: 'https://readwise.io', folderId: 'reading', spaceId: 'personal', iconType: 'api', iconValue: 'https://readwise.io' },
  // ── AI ────────────────────────────────────────────
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://chat.openai.com' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://claude.ai' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://gemini.google.com' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://www.perplexity.ai' },
  // ── Content ───────────────────────────────────────
  { id: 'canva', name: 'Canva', url: 'https://www.canva.com', folderId: 'creative', spaceId: 'content', iconType: 'api', iconValue: 'https://www.canva.com' },
  { id: 'figjam', name: 'FigJam', url: 'https://www.figma.com/figjam', folderId: 'creative', spaceId: 'content', iconType: 'api', iconValue: 'https://www.figma.com' },
  { id: 'unsplash', name: 'Unsplash', url: 'https://unsplash.com', folderId: 'creative', spaceId: 'content', iconType: 'api', iconValue: 'https://unsplash.com' },
];

export const recentTabs: AppShortcut[] = [
  { id: 'calendar', name: 'Calendar', url: 'https://calendar.google.com', folderId: null, iconType: 'api', iconValue: 'https://calendar.google.com' },
  { id: 'drive', name: 'Drive', url: 'https://drive.google.com', folderId: null, iconType: 'api', iconValue: 'https://drive.google.com' },
];

export const defaultConfig: AppConfig = {
  apps: shortcuts,
  folders,
  pinnedIds: ['chatgpt', 'notion', 'youtube', 'gmail'],
  currentSpaceId: 'work',
  locale: 'zh-Hant',
  theme: 'sonoma',
  glass: 72,
  gridColumns: 7,
  gridRows: 4,
  showDock: true,
  showWidgets: true,
  defaultEngine: 'google',
  searchEngines: defaultSearchEngines,
  widgets: {
    notes: '長按 icon 進入編輯模式。拖到 Dock 可固定。',
    todos: [
      { id: 'todo-1', text: '同步 Chrome 書籤', done: false },
      { id: 'todo-2', text: '整理 AI 工作區', done: true },
    ],
    pomodoroMinutes: 25,
    pomodoroRemainingSeconds: 25 * 60,
    pomodoroRunning: false,
  },
  experiments: {
    smartRecommendations: false,
    recentVisits: true,
    keyboardShortcuts: true,
    conflictWarning: false,
  },
};
