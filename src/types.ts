export interface Folder {
  id: string;
  name: string;
  color?: string;
  spaceId?: string; // if set, folder only appears in this space
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

export interface WidgetState {
  notes: string;
  todos: Array<{ id: string; text: string; done: boolean }>;
  pomodoroMinutes: number;
  pomodoroRemainingSeconds: number;
  pomodoroRunning: boolean;
}

export interface PromptTag {
  label: string;
  color: string; // hex e.g. '#6366f1'
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: PromptTag[];  // changed from string[] to PromptTag[]
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
