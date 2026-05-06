export interface Folder {
  id: string;
  name: string;
  color?: string;
  spaceId?: string;
}

export interface AppShortcut {
  id: string;
  name: string;
  url: string;
  folderId: string | null;
  spaceId?: string;
  iconType: 'api' | 'monogram' | 'custom';
  iconValue: string;
  iconColor?: string;
}

export interface Space {
  id: string;
  name: string;
  accent: string;
}

export type SearchEngineId = string;

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  shortcut: string;
  template: string;
  enabled: boolean;
  builtIn?: boolean;
}

export type Locale = 'en' | 'zh-Hant' | 'zh-Hans';

export type ThemeName = 'sonoma' | 'ventura' | 'slate';

// ── Todo list categories ──────────────────────────────────────────────
export interface TodoList {
  id: string;
  name: string;
  builtIn?: boolean; // true = cannot be deleted
}

export const DEFAULT_TODO_LISTS: TodoList[] = [
  { id: 'today',     name: 'Today',     builtIn: true },
  { id: 'upcoming',  name: 'Upcoming',  builtIn: true },
  { id: 'inbox',     name: 'Inbox',     builtIn: true },
  { id: 'completed', name: 'Completed', builtIn: true },
];

// ── Widget visibility / UI state ──────────────────────────────────────
export interface WidgetMeta {
  enabled: boolean;   // true = widget exists; false = completely hidden (no icon)
  minimised: boolean; // true = collapsed to floating icon
  pinned: boolean;    // true = stays expanded; false = hides on outside click
  expanded: boolean;  // true = larger view
}

export interface WidgetState {
  notes: string;
  todos: Array<{ id: string; text: string; done: boolean; listId: string }>;
  todoLists: TodoList[];
  activeTodoListId: string;
  pomodoroMinutes: number;
  pomodoroRemainingSeconds: number;
  pomodoroRunning: boolean;
  // Per-widget UI state
  todoMeta: WidgetMeta;
  pomodoroMeta: WidgetMeta;
  notesMeta: WidgetMeta;
}

export interface PromptTag {
  label: string;
  color: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: PromptTag[];
  imageUrl?: string;
  spaceId?: string;
  createdAt: number;
}

export interface AppConfig {
  apps: AppShortcut[];
  folders: Folder[];
  pinnedIds: string[];
  currentSpaceId: string;
  locale: Locale;
  theme: ThemeName;
  glass: number;
  gridColumns: number;
  gridRows: number;
  showDock: boolean;
  showWidgets: boolean;
  defaultEngine: SearchEngineId;
  searchEngines: SearchEngine[];
  widgets: WidgetState;
  prompts: Prompt[];
  experiments: {
    smartRecommendations: boolean;
    recentVisits: boolean;
    keyboardShortcuts: boolean;
    conflictWarning: boolean;
  };
}
