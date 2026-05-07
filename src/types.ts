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

export const SPACE_ACCENTS = [
  { value: 'from-blue-500 to-cyan-400',     label: '藍' },
  { value: 'from-violet-500 to-pink-400',   label: '紫' },
  { value: 'from-emerald-500 to-teal-400',  label: '綠' },
  { value: 'from-orange-500 to-amber-400',  label: '橙' },
  { value: 'from-rose-500 to-pink-400',     label: '玫' },
  { value: 'from-sky-500 to-indigo-400',    label: '靛' },
] as const;

export interface Space {
  id: string;
  name: string;
  accent: string;
}

export const DEFAULT_SPACES: Space[] = [
  { id: 'work',     name: 'Work',     accent: 'from-blue-500 to-cyan-400' },
  { id: 'personal', name: 'Personal', accent: 'from-violet-500 to-pink-400' },
  { id: 'study',    name: 'Study',    accent: 'from-emerald-500 to-teal-400' },
];

export interface SearchEngine {
  id: string;
  name: string;
  url?: string;
  shortcut?: string;
  template?: string;
  enabled: boolean;
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
