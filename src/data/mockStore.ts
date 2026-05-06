import type { AppConfig, AppShortcut, Folder, Prompt, SearchEngine, Space } from '../types';

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

export const shortcuts: AppShortcut[] = [
  { id: 'notion', name: 'Notion', url: 'https://www.notion.so', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://www.notion.so' },
  { id: 'linear', name: 'Linear', url: 'https://linear.app', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://linear.app' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://github.com' },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://mail.google.com' },
  { id: 'gcal', name: 'Calendar', url: 'https://calendar.google.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://calendar.google.com' },
  { id: 'gdrive', name: 'Drive', url: 'https://drive.google.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://drive.google.com' },
  { id: 'figma', name: 'Figma', url: 'https://www.figma.com', folderId: null, spaceId: 'work', iconType: 'api', iconValue: 'https://www.figma.com' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', folderId: null, spaceId: 'personal', iconType: 'api', iconValue: 'https://www.youtube.com' },
  { id: 'taobao', name: 'Taobao', url: 'https://www.taobao.com', folderId: 'shopping', spaceId: 'personal', iconType: 'api', iconValue: 'https://www.taobao.com' },
  { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com', folderId: 'shopping', spaceId: 'personal', iconType: 'api', iconValue: 'https://www.amazon.com' },
  { id: 'medium', name: 'Medium', url: 'https://medium.com', folderId: 'reading', spaceId: 'personal', iconType: 'api', iconValue: 'https://medium.com' },
  { id: 'substack', name: 'Substack', url: 'https://substack.com', folderId: 'reading', spaceId: 'personal', iconType: 'api', iconValue: 'https://substack.com' },
  { id: 'readwise', name: 'Readwise', url: 'https://readwise.io', folderId: 'reading', spaceId: 'personal', iconType: 'api', iconValue: 'https://readwise.io' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://chat.openai.com' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://claude.ai' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://gemini.google.com' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai', folderId: null, spaceId: 'ai', iconType: 'api', iconValue: 'https://www.perplexity.ai' },
  { id: 'canva', name: 'Canva', url: 'https://www.canva.com', folderId: 'creative', spaceId: 'content', iconType: 'api', iconValue: 'https://www.canva.com' },
  { id: 'figjam', name: 'FigJam', url: 'https://www.figma.com/figjam', folderId: 'creative', spaceId: 'content', iconType: 'api', iconValue: 'https://www.figma.com' },
  { id: 'unsplash', name: 'Unsplash', url: 'https://unsplash.com', folderId: 'creative', spaceId: 'content', iconType: 'api', iconValue: 'https://unsplash.com' },
];

export const recentTabs: AppShortcut[] = [
  { id: 'calendar', name: 'Calendar', url: 'https://calendar.google.com', folderId: null, iconType: 'api', iconValue: 'https://calendar.google.com' },
  { id: 'drive', name: 'Drive', url: 'https://drive.google.com', folderId: null, iconType: 'api', iconValue: 'https://drive.google.com' },
];

export const defaultPrompts: Prompt[] = [
  {
    id: 'p-1', title: 'Blog Post Writer',
    content: 'Write a detailed, engaging blog post about [TOPIC]. Include an attention-grabbing headline, introduction, 3-5 main sections with subheadings, and a conclusion with a call to action. Tone: [casual/professional]. Target audience: [AUDIENCE].',
    tags: [
      { label: 'writing', color: '#6366f1' },
      { label: 'content', color: '#f59e0b' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80',
    createdAt: 1714900000000,
  },
  {
    id: 'p-2', title: 'Code Reviewer',
    content: 'Review the following code for bugs, performance issues, and best practices. Provide specific suggestions with corrected code snippets where applicable.\n\n```\n[PASTE CODE HERE]\n```',
    tags: [
      { label: 'coding', color: '#10b981' },
      { label: 'dev', color: '#3b82f6' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
    createdAt: 1714900100000,
  },
  {
    id: 'p-3', title: 'Social Media Caption',
    content: 'Create 5 engaging social media captions for [PLATFORM] about [TOPIC]. Include relevant hashtags, emojis, and a clear call-to-action. Keep each caption under [CHARACTER LIMIT] characters.',
    tags: [
      { label: 'content', color: '#f59e0b' },
      { label: 'social', color: '#ec4899' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
    createdAt: 1714900200000,
  },
  {
    id: 'p-4', title: 'Meeting Summariser',
    content: 'Summarise the following meeting transcript into: 1) Key decisions made, 2) Action items with owners and deadlines, 3) Open questions. Format as bullet points.\n\n[PASTE TRANSCRIPT]',
    tags: [
      { label: 'productivity', color: '#8b5cf6' },
      { label: 'writing', color: '#6366f1' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80',
    createdAt: 1714900300000,
  },
  {
    id: 'p-5', title: 'Product Description',
    content: 'Write a compelling product description for [PRODUCT NAME]. Highlight key benefits (not just features), address pain points, include social proof placeholder, and end with urgency/CTA. Length: [SHORT/MEDIUM/LONG].',
    tags: [
      { label: 'writing', color: '#6366f1' },
      { label: 'marketing', color: '#f97316' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    createdAt: 1714900400000,
  },
  {
    id: 'p-6', title: "Explain Like I'm 5",
    content: "Explain [CONCEPT] to a complete beginner using simple language, a real-world analogy, and a short example. Avoid jargon. End with one key takeaway.",
    tags: [
      { label: 'learning', color: '#14b8a6' },
      { label: 'writing', color: '#6366f1' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    createdAt: 1714900500000,
  },
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
  prompts: defaultPrompts,
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
