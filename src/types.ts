export type Locale = 'en' | 'zh-Hant' | 'zh-Hans';

export interface WidgetMeta {
  enabled: boolean;
  minimised: boolean;
  pinned: boolean;
  expanded: boolean;
}

export const DEFAULT_META: WidgetMeta = {
  enabled: true,
  minimised: false,
  pinned: false,
  expanded: false,
};

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
  listId: string;
}

export interface TodoList {
  id: string;
  name: string;
  builtIn?: boolean;
}

export const DEFAULT_TODO_LISTS: TodoList[] = [
  { id: 'today',     name: 'Today',     builtIn: true },
  { id: 'upcoming',  name: 'Upcoming',  builtIn: true },
  { id: 'inbox',     name: 'Inbox',     builtIn: true },
  { id: 'completed', name: 'Completed', builtIn: true },
];

export interface WidgetState {
  notes: string;
  todos: TodoItem[];
  todoLists: TodoList[];
  activeTodoListId: string;
  pomodoroMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroRemainingSeconds: number;
  pomodoroRunning: boolean;
  pomodoroIsBreak: boolean;
  pomodoroTask: string;
  focusModeActive: boolean;
  focusSoundState?: Record<string, unknown>;
  // Per-widget UI state
  todoMeta: WidgetMeta;
  pomodoroMeta: WidgetMeta;
  notesMeta: WidgetMeta;
}

export interface PromptTag {
  label: string;
  color?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  createdAt: number;
}

export interface AppShortcut {
  id: string;
  name: string;
  url: string;
  folderId?: string | null;
  iconType?: string;
  iconValue?: string;
  icon?: string;
  iconColor?: string;
  spaceId?: string;
}

export interface Folder {
  id: string;
  name: string;
  appIds: string[];
  spaceId?: string;
}

export interface Space {
  id: string;
  name: string;
  accent: string;
}

export interface SearchEngine {
  id: string;
  name: string;
  url?: string;
  shortcut?: string;
  template?: string;
  enabled?: boolean;
  builtIn?: boolean;
  icon?: string;
}

export type SearchEngineId = string;
export type ThemeName = 'sonoma' | 'ventura' | 'slate';

export interface AppConfig {
  spaces?: Space[];
  currentSpaceId: string;
  apps: AppShortcut[];
  folders: Folder[];
  pinnedIds: string[];
  searchEngines: SearchEngine[];
  defaultEngine?: string;
  locale: Locale;
  glass: number;
  gridColumns: number;
  gridRows: number;
  showDock: boolean;
  showWidgets: boolean;
  wallpaper?: string;
  theme: ThemeName | string;
  widgets: WidgetState;
  prompts: Prompt[];
  experiments: {
    smartRecommendations: boolean;
    recentVisits: boolean;
    keyboardShortcuts: boolean;
    conflictWarning: boolean;
  };
}
