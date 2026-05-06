import type { AppConfig } from '../types';
import { DEFAULT_TODO_LISTS } from '../types';

export const spaces = [
  { id: 'work',     name: 'Work',     accent: 'from-blue-500 to-cyan-400' },
  { id: 'personal', name: 'Personal', accent: 'from-violet-500 to-pink-400' },
  { id: 'study',    name: 'Study',    accent: 'from-emerald-500 to-teal-400' },
];

export const recentTabs: AppConfig['apps'] = [];

const DEFAULT_META = { enabled: true, minimised: false, pinned: false, expanded: false };

export const defaultConfig: AppConfig = {
  currentSpaceId: 'work',
  locale: 'en',
  theme: 'sonoma',
  glass: 72,
  gridColumns: 7,
  gridRows: 4,
  showDock: true,
  showWidgets: true,
  pinnedIds: ['chatgpt', 'notion', 'perplexity'],
  folders: [],
  prompts: [],
  apps: [
    { id: 'chatgpt',    name: 'ChatGPT',    url: 'https://chat.openai.com',   folderId: null, iconType: 'api', iconValue: 'chat.openai.com',   iconColor: '' },
    { id: 'notion',     name: 'Notion',     url: 'https://notion.so',         folderId: null, iconType: 'api', iconValue: 'notion.so',          iconColor: '' },
    { id: 'youtube',    name: 'YouTube',    url: 'https://youtube.com',       folderId: null, iconType: 'api', iconValue: 'youtube.com',        iconColor: '' },
    { id: 'gmail',      name: 'Gmail',      url: 'https://mail.google.com',   folderId: null, iconType: 'api', iconValue: 'mail.google.com',    iconColor: '' },
    { id: 'perplexity', name: 'Perplexity', url: 'https://perplexity.ai',     folderId: null, iconType: 'api', iconValue: 'perplexity.ai',      iconColor: '' },
    { id: 'figma',      name: 'Figma',      url: 'https://figma.com',         folderId: null, iconType: 'api', iconValue: 'figma.com',          iconColor: '' },
    { id: 'github',     name: 'GitHub',     url: 'https://github.com',        folderId: null, iconType: 'api', iconValue: 'github.com',         iconColor: '' },
    { id: 'linear',     name: 'Linear',     url: 'https://linear.app',        folderId: null, iconType: 'api', iconValue: 'linear.app',         iconColor: '' },
  ],
  defaultEngine: 'google',
  searchEngines: [
    { id: 'google',      name: 'Google',      shortcut: 'g',  template: 'https://www.google.com/search?q={q}',             enabled: true, builtIn: true },
    { id: 'bing',        name: 'Bing',        shortcut: 'b',  template: 'https://www.bing.com/search?q={q}',                enabled: true, builtIn: true },
    { id: 'duckduckgo',  name: 'DuckDuckGo',  shortcut: 'd',  template: 'https://duckduckgo.com/?q={q}',                    enabled: true, builtIn: true },
    { id: 'perplexity',  name: 'Perplexity',  shortcut: 'p',  template: 'https://www.perplexity.ai/search?q={q}',           enabled: true, builtIn: true },
    { id: 'youtube',     name: 'YouTube',     shortcut: 'yt', template: 'https://www.youtube.com/results?search_query={q}', enabled: true, builtIn: true },
    { id: 'maps',        name: 'Google Maps', shortcut: 'm',  template: 'https://www.google.com/maps/search/{q}',           enabled: true, builtIn: true },
  ],
  widgets: {
    notes: '',
    todos: [
      { id: 'todo-demo-1', text: 'Review pull request', done: false, listId: 'today' },
      { id: 'todo-demo-2', text: 'Team standup',        done: false, listId: 'today' },
      { id: 'todo-demo-3', text: 'Plan sprint goals',   done: false, listId: 'upcoming' },
    ],
    todoLists: [...DEFAULT_TODO_LISTS],
    activeTodoListId: 'today',
    pomodoroMinutes: 25,
    pomodoroBreakMinutes: 5,
    pomodoroRemainingSeconds: 1500,
    pomodoroRunning: false,
    pomodoroIsBreak: false,
    pomodoroTask: '',
    focusModeActive: false,
    todoMeta:     { ...DEFAULT_META },
    pomodoroMeta: { ...DEFAULT_META },
    notesMeta:    { ...DEFAULT_META },
  },
  experiments: {
    smartRecommendations: false,
    recentVisits: true,
    keyboardShortcuts: true,
    conflictWarning: true,
  },
};
