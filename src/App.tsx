/// <reference types="chrome" />
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { BookMarked } from 'lucide-react';
import { AppGrid, FOLDER_DROP_PREFIX } from './components/AppGrid';
import { Dock } from './components/Dock';
import { AppIcon } from './components/AppIcon';
import { PromptLibrary } from './components/PromptLibrary';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutEditor } from './components/ShortcutEditor';
import { SpotlightSearch } from './components/SpotlightSearch';
import { Toast } from './components/Toast';
import { TopBar, SPACE_DROP_PREFIX } from './components/TopBar';
import { Widgets, FocusModeOverlay } from './components/Widgets';
import { AiPortalBar } from './components/AiPortalBar';
import { defaultConfig, recentTabs } from './data/mockStore';
import { createTranslator } from './i18n';
import { usePageAnimations } from './lib/usePageAnimations';
import type { AppConfig, AppShortcut, Prompt, Space, WidgetMeta, WidgetState } from './types';
import { DEFAULT_NOTE_TABS, DEFAULT_SPACES, DEFAULT_TODO_LISTS, DEFAULT_AI_PORTALS, AI_PORTAL_SIZE_DEFAULT } from './types';

type EditorState = {
  open: boolean;
  mode: 'add' | 'edit';
  appId: string | null;
  folderId: string | null;
};

const CONFIG_KEY = 'workspace-new-tab-config';

function cloneDefaultConfig(): AppConfig {
  return JSON.parse(JSON.stringify(defaultConfig)) as AppConfig;
}

const DEFAULT_META: WidgetMeta = { enabled: true, minimised: false, pinned: false, expanded: false };

function mergeConfigWithDefaults(config: Partial<AppConfig>): AppConfig {
  const fallback = cloneDefaultConfig();
  const raw = (config.widgets ?? {}) as Partial<WidgetState>;
  const fb  = fallback.widgets;

  const todos = (raw.todos ?? fb.todos).map((t) => ({
    ...t,
    listId: t.listId ?? 'inbox',
  }));

  const noteTabs = (() => {
    if (raw.noteTabs && raw.noteTabs.length > 0) return raw.noteTabs;
    if (raw.notes && raw.notes.trim()) {
      return [{ id: 'note-default', name: 'Notes', content: raw.notes, updatedAt: Date.now() }];
    }
    return [...DEFAULT_NOTE_TABS].map(t => ({ ...t, updatedAt: Date.now() }));
  })();

  const widgets: WidgetState = {
    ...fb,
    ...raw,
    todos,
    noteTabs,
    activeNoteTabId: raw.activeNoteTabId ?? noteTabs[0]?.id ?? 'note-default',
    todoLists:        (raw.todoLists && raw.todoLists.length > 0) ? raw.todoLists : [...DEFAULT_TODO_LISTS],
    activeTodoListId: raw.activeTodoListId ?? 'today',
    todoMeta:         { ...DEFAULT_META, ...(raw.todoMeta     ?? {}) },
    pomodoroMeta:     { ...DEFAULT_META, ...(raw.pomodoroMeta ?? {}) },
    notesMeta:        { ...DEFAULT_META, ...(raw.notesMeta    ?? {}) },
    focusModeActive:  raw.focusModeActive ?? false,
  };

  if (!widgets.pomodoroRemainingSeconds) {
    widgets.pomodoroRemainingSeconds = widgets.pomodoroMinutes * 60;
  }

  return {
    ...fallback,
    ...config,
    spaces:        (config.spaces && config.spaces.length > 0) ? config.spaces : [...DEFAULT_SPACES],
    apps:          config.apps          ?? fallback.apps,
    folders:       config.folders       ?? fallback.folders,
    pinnedIds:     config.pinnedIds     ?? fallback.pinnedIds,
    searchEngines: config.searchEngines ?? fallback.searchEngines,
    prompts:       config.prompts       ?? fallback.prompts,
    aiPortals:     (config.aiPortals && config.aiPortals.length > 0) ? config.aiPortals : [...DEFAULT_AI_PORTALS],
    widgets,
    experiments: { ...fallback.experiments, ...(config.experiments ?? {}) },
  };
}

function isChromeExtensionApiAvailable() {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function glassBtn(glass: number, active = false): React.CSSProperties {
  const alpha = Math.min(0.40, Math.max(0.08, glass / 280)) * (active ? 1.8 : 1);
  const blur  = Math.round(4 + glass / 10);
  return {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };
}

function getPageIndex(item: { pageIndex?: number }): number {
  return item.pageIndex ?? 0;
}

function firstFreeSlot(
  items: Array<{ pageIndex?: number }>,
  page: number,
  capacity: number,
): boolean {
  const count = items.filter((i) => getPageIndex(i) === page).length;
  return count < capacity;
}

function nextAvailablePage(
  items: Array<{ pageIndex?: number }>,
  capacity: number,
): number {
  let page = 0;
  while (!firstFreeSlot(items, page, capacity)) page++;
  return page;
}

export const GRID_CONTAINER_ID = 'app-grid';
export const DOCK_CONTAINER_ID = 'dock';

// ── iOS-style collision detection ────────────────────────────────────────
const iosFolderCollision: CollisionDetection = (args) => {
  const { droppableContainers, active, pointerCoordinates } = args;
  if (!pointerCoordinates) return closestCenter(args);

  const folderDrops = droppableContainers.filter((c) =>
    typeof c.id === 'string' && c.id.startsWith(FOLDER_DROP_PREFIX),
  );

  for (const droppable of folderDrops) {
    const rect = droppable.rect.current;
    if (!rect) continue;
    const cx = rect.left + rect.width  * 0.225;
    const cy = rect.top  + rect.height * 0.225;
    const cw = rect.width  * 0.55;
    const ch = rect.height * 0.55;
    const { x, y } = pointerCoordinates;
    if (x >= cx && x <= cx + cw && y >= cy && y <= cy + ch) {
      const activeId = active.id as string;
      const folderId = (droppable.id as string).slice(FOLDER_DROP_PREFIX.length);
      if (activeId !== folderId) {
        return [{ id: droppable.id }];
      }
    }
  }

  const nonFolderDrops = droppableContainers.filter((c) =>
    typeof c.id !== 'string' || !c.id.startsWith(FOLDER_DROP_PREFIX),
  );
  return closestCenter({ ...args, droppableContainers: nonFolderDrops });
};

const EDGE_ZONE = 96;

function NewTab() {
  const [config, setConfig] = useState<AppConfig>(() => cloneDefaultConfig());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [spaceDirection, setSpaceDirection] = useState<'left' | 'right' | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    open: false, mode: 'add', appId: null, folderId: null,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overContainer, setOverContainer] = useState<string | null>(null);

  const pageFlipTimerRef = useRef<number | null>(null);
  const currentPageRef = useRef(0);
  const [externalPage, setExternalPage] = useState<number | null>(null);

  const clearPageFlip = () => {
    if (pageFlipTimerRef.current !== null) {
      window.clearTimeout(pageFlipTimerRef.current);
      pageFlipTimerRef.current = null;
    }
  };

  const schedulePageFlip = (direction: 'prev' | 'next', totalPages: number) => {
    if (pageFlipTimerRef.current !== null) return;
    pageFlipTimerRef.current = window.setTimeout(() => {
      pageFlipTimerRef.current = null;
      const cur = currentPageRef.current;
      if (direction === 'next' && cur < totalPages - 1) {
        setExternalPage(cur + 1);
        currentPageRef.current = cur + 1;
      } else if (direction === 'prev' && cur > 0) {
        setExternalPage(cur - 1);
        currentPageRef.current = cur - 1;
      }
    }, 600);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const t = useMemo(() => createTranslator(config.locale), [config.locale]);
  const editingApp = config.apps.find((app) => app.id === editor.appId) ?? null;

  const spaces: Space[] = useMemo(
    () => (config.spaces && config.spaces.length > 0) ? config.spaces : [...DEFAULT_SPACES],
    [config.spaces],
  );

  const aiPortals = useMemo(
    () => config.aiPortals && config.aiPortals.length > 0 ? config.aiPortals : [...DEFAULT_AI_PORTALS],
    [config.aiPortals],
  );

  const pinnedApps = useMemo(
    () => config.pinnedIds.map((id) => config.apps.find((app) => app.id === id)).filter((app): app is AppShortcut => Boolean(app)),
    [config.apps, config.pinnedIds],
  );

  const currentSpaceApps = useMemo(
    () => config.apps.filter(
      (app) =>
        (!app.spaceId || app.spaceId === config.currentSpaceId) &&
        !config.pinnedIds.includes(app.id),
    ),
    [config.apps, config.currentSpaceId, config.pinnedIds],
  );

  const currentSpaceFolders = useMemo(
    () => config.folders.filter((f) => !f.spaceId || f.spaceId === config.currentSpaceId),
    [config.folders, config.currentSpaceId],
  );

  const allApps = useMemo(
    () => config.apps.filter((app) => !config.pinnedIds.includes(app.id)),
    [config.apps, config.pinnedIds],
  );

  const activeApp = useMemo(
    () => config.apps.find((a) => a.id === activeId) ?? null,
    [config.apps, activeId],
  );

  const totalPages = useMemo(() => {
    const spaceItems = currentSpaceApps.filter((a) => !a.folderId);
    const all: Array<{ pageIndex?: number }> = [...spaceItems, ...currentSpaceFolders];
    if (all.length === 0) return 1;
    return Math.max(...all.map((i) => i.pageIndex ?? 0)) + 1;
  }, [currentSpaceApps, currentSpaceFolders]);

  usePageAnimations(false);

  const updateConfig = (next: AppConfig) => {
    const enabledEngines = next.searchEngines.filter((e) => e.enabled);
    const normalized: AppConfig = {
      ...next,
      defaultEngine: enabledEngines.some((e) => e.id === next.defaultEngine)
        ? next.defaultEngine
        : (enabledEngines[0]?.id ?? next.searchEngines[0]?.id ?? 'google'),
      gridColumns: Math.min(10, Math.max(4, Number(next.gridColumns) || 7)),
      gridRows: Math.min(7, Math.max(3, Number(next.gridRows) || 4)),
      glass: Math.min(95, Math.max(30, Number(next.glass) || 72)),
    };
    setConfig(normalized);
    if (isChromeExtensionApiAvailable()) chrome.storage.local.set({ [CONFIG_KEY]: normalized });
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  const spaceDirectionRef = useRef<'left' | 'right' | null>(null);
  const switchSpace = (spaceId: string) => {
    const currentIdx = spaces.findIndex((s) => s.id === config.currentSpaceId);
    const nextIdx = spaces.findIndex((s) => s.id === spaceId);
    const dir: 'left' | 'right' = nextIdx > currentIdx ? 'right' : 'left';
    spaceDirectionRef.current = dir;
    setSpaceDirection(dir);
    setSelectedFolderId(null);
    updateConfig({ ...config, currentSpaceId: spaceId });
    setTimeout(() => setSpaceDirection(null), 400);
  };

  useEffect(() => {
    if (isChromeExtensionApiAvailable()) {
      chrome.storage.local.get(CONFIG_KEY, (result) => {
        if (result[CONFIG_KEY]) setConfig(mergeConfigWithDefaults(result[CONFIG_KEY] as Partial<AppConfig>));
      });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;

      if (ctrl && (event.key === 'ArrowRight' || event.key === 'ArrowLeft') && !searchOpen && !settingsOpen) {
        event.preventDefault();
        setConfig((current) => {
          const allSpaces = (current.spaces && current.spaces.length > 0) ? current.spaces : [...DEFAULT_SPACES];
          if (allSpaces.length < 2) return current;
          const idx = allSpaces.findIndex((s) => s.id === current.currentSpaceId);
          const next = event.key === 'ArrowRight'
            ? allSpaces[(idx + 1) % allSpaces.length]
            : allSpaces[(idx - 1 + allSpaces.length) % allSpaces.length];
          const dir: 'left' | 'right' = event.key === 'ArrowRight' ? 'right' : 'left';
          setSpaceDirection(dir);
          setTimeout(() => setSpaceDirection(null), 400);
          const updated = { ...current, currentSpaceId: next.id };
          if (isChromeExtensionApiAvailable()) chrome.storage.local.set({ [CONFIG_KEY]: updated });
          return updated;
        });
        return;
      }

      const isCommandK = ctrl && event.key.toLowerCase() === 'k';
      if (isCommandK && config.experiments.keyboardShortcuts) { event.preventDefault(); setSearchOpen(true); }

      if (event.key === 'Escape') {
        if (config.widgets.focusModeActive) {
          updateConfig({ ...config, widgets: { ...config.widgets, focusModeActive: false } });
          return;
        }
        setSettingsOpen(false); setSearchOpen(false); setSelectedFolderId(null); setEditing(false); setShowPrompts(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.experiments.keyboardShortcuts, config.widgets.focusModeActive, searchOpen, settingsOpen]);

  useEffect(() => {
    if (!config.widgets.pomodoroRunning) return;
    const timer = window.setInterval(() => {
      setConfig((current) => {
        const remaining = Math.max(0, current.widgets.pomodoroRemainingSeconds - 1);
        const next = { ...current, widgets: { ...current.widgets, pomodoroRemainingSeconds: remaining, pomodoroRunning: remaining > 0 } };
        if (isChromeExtensionApiAvailable()) chrome.storage.local.set({ [CONFIG_KEY]: next });
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [config.widgets.pomodoroRunning]);

  const openShortcutEditor = (folderId: string | null = null) => {
    setEditor({ open: true, mode: 'add', appId: null, folderId });
  };

  const renameShortcut = (appId: string) => {
    setEditor({ open: true, mode: 'edit', appId, folderId: null });
  };

  const saveShortcut = (shortcut: Pick<AppShortcut, 'name' | 'url' | 'folderId' | 'iconType' | 'iconValue' | 'iconColor'>) => {
    if (editor.mode === 'edit' && editor.appId) {
      updateConfig({ ...config, apps: config.apps.map((app) => (app.id === editor.appId ? { ...app, ...shortcut } : app)) });
      notify(t('editWebsite'));
      return;
    }
    const id = `${shortcut.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const spaceItems = config.apps
      .filter((a) => (!a.spaceId || a.spaceId === config.currentSpaceId) && !config.pinnedIds.includes(a.id));
    const capacity = config.gridColumns * config.gridRows;
    const page = nextAvailablePage(spaceItems, capacity);
    updateConfig({ ...config, apps: [...config.apps, { id, ...shortcut, spaceId: config.currentSpaceId, pageIndex: page }] });
    notify(t('addWebsite'));
  };

  const deleteApp = (appId: string) => {
    updateConfig({ ...config, apps: config.apps.filter((app) => app.id !== appId), pinnedIds: config.pinnedIds.filter((id) => id !== appId) });
    notify(t('delete'));
  };

  const unpinApp = (appId: string) => {
    updateConfig({ ...config, pinnedIds: config.pinnedIds.filter((id) => id !== appId) });
    notify('Removed from Dock');
  };

  const pinApp = (appId: string) => {
    if (!config.apps.some((app) => app.id === appId)) return;
    updateConfig({ ...config, pinnedIds: config.pinnedIds.includes(appId) ? config.pinnedIds : [...config.pinnedIds.slice(-7), appId] });
    notify('Pinned to Dock');
  };

  const reorderPinnedApp = (draggedId: string, overId: string) => {
    const ids = config.pinnedIds;
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(overId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    updateConfig({ ...config, pinnedIds: arrayMove(ids, fromIndex, toIndex) });
  };

  // Reorder grid apps: use arrayMove on the apps array itself.
  // pageIndex stays unchanged (same page), only array order changes.
  const reorderItems = (draggedId: string, targetId: string) => {
    const isPinned = config.pinnedIds.includes(draggedId);
    let apps = config.apps;
    let pinnedIds = config.pinnedIds;

    if (isPinned) {
      // Moving from dock to grid: unpin and place at target's pageIndex
      pinnedIds = pinnedIds.filter((id) => id !== draggedId);
      const targetApp = apps.find((a) => a.id === targetId);
      if (!targetApp) return;
      apps = apps.map((a) =>
        a.id === draggedId
          ? { ...a, pageIndex: targetApp.pageIndex ?? 0, spaceId: config.currentSpaceId, folderId: null }
          : a,
      );
      // Move dragged to just before target in array
      const fromIdx = apps.findIndex((a) => a.id === draggedId);
      const toIdx   = apps.findIndex((a) => a.id === targetId);
      if (fromIdx >= 0 && toIdx >= 0) apps = arrayMove(apps, fromIdx, toIdx);
      updateConfig({ ...config, apps, pinnedIds });
      notify('Moved to Home Screen');
      return;
    }

    // Same-page grid reorder: arrayMove, keep pageIndex the same
    const draggedApp = apps.find((a) => a.id === draggedId);
    const targetApp  = apps.find((a) => a.id === targetId);
    if (!draggedApp || !targetApp) return;

    // If cross-page drop, adopt target's pageIndex
    const newPageIndex = targetApp.pageIndex ?? 0;
    apps = apps.map((a) =>
      a.id === draggedId ? { ...a, pageIndex: newPageIndex } : a,
    );

    const fromIdx = apps.findIndex((a) => a.id === draggedId);
    const toIdx   = apps.findIndex((a) => a.id === targetId);
    if (fromIdx >= 0 && toIdx >= 0) apps = arrayMove(apps, fromIdx, toIdx);
    updateConfig({ ...config, apps, pinnedIds });
  };

  const moveAppToEnd = (appId: string) => {
    const isPinned = config.pinnedIds.includes(appId);
    const app = config.apps.find((a) => a.id === appId);
    if (!app) return;
    const capacity = config.gridColumns * config.gridRows;
    const spaceItems = config.apps.filter(
      (a) => (!a.spaceId || a.spaceId === config.currentSpaceId) && !config.pinnedIds.includes(a.id) && a.id !== appId,
    );
    const maxPage = spaceItems.reduce((m, a) => Math.max(m, a.pageIndex ?? 0), 0);
    const lastPageCount = spaceItems.filter((a) => (a.pageIndex ?? 0) === maxPage).length;
    const targetPage = lastPageCount < capacity ? maxPage : maxPage + 1;
    const pinnedIds = isPinned ? config.pinnedIds.filter((id) => id !== appId) : config.pinnedIds;
    const apps = config.apps.map((a) =>
      a.id === appId ? { ...a, pageIndex: targetPage, spaceId: config.currentSpaceId, folderId: null } : a,
    );
    updateConfig({ ...config, apps, pinnedIds });
    if (isPinned) notify('Moved to Home Screen');
  };

  const moveToFolder = (appId: string, folderId: string) => {
    if (!config.apps.some((app) => app.id === appId)) return;
    updateConfig({ ...config, apps: config.apps.map((app) =>
      app.id === appId ? { ...app, folderId, pageIndex: undefined } : app,
    ) });
    notify('Moved to folder');
  };

  const moveOutOfFolder = (appId: string) => {
    const app = config.apps.find((a) => a.id === appId);
    if (!app) return;
    const capacity = config.gridColumns * config.gridRows;
    const spaceItems = config.apps.filter(
      (a) => (!a.spaceId || a.spaceId === config.currentSpaceId) && !config.pinnedIds.includes(a.id) && !a.folderId && a.id !== appId,
    );
    const page = nextAvailablePage(spaceItems, capacity);
    updateConfig({ ...config, apps: config.apps.map((a) =>
      a.id === appId ? { ...a, folderId: null, pageIndex: page } : a,
    ) });
    notify('Moved to Home Screen');
  };

  const moveToSpace = (appId: string, spaceId: string | undefined) => {
    updateConfig({ ...config, apps: config.apps.map((app) => (app.id === appId ? { ...app, spaceId } : app)) });
    const spaceName = spaceId ? (spaces.find((s) => s.id === spaceId)?.name ?? spaceId) : 'All Spaces';
    notify(`Moved to ${spaceName}`);
  };

  const addFolder = () => {
    const id = `folder-${Date.now().toString(36)}`;
    const capacity = config.gridColumns * config.gridRows;
    const spaceItems: Array<{ pageIndex?: number }> = [
      ...config.apps.filter((a) => (!a.spaceId || a.spaceId === config.currentSpaceId) && !config.pinnedIds.includes(a.id)),
      ...config.folders.filter((f) => !f.spaceId || f.spaceId === config.currentSpaceId),
    ];
    const page = nextAvailablePage(spaceItems, capacity);
    updateConfig({ ...config, folders: [...config.folders, { id, name: t('newFolder'), appIds: [], spaceId: config.currentSpaceId, pageIndex: page }] });
    notify(t('newFolder'));
  };

  const renameFolder = (folderId: string, name: string) => {
    updateConfig({ ...config, folders: config.folders.map((f) => (f.id === folderId ? { ...f, name } : f)) });
    notify(t('renameFolder'));
  };

  const deleteFolder = (folderId: string) => {
    updateConfig({ ...config, folders: config.folders.filter((f) => f.id !== folderId), apps: config.apps.map((app) => (app.folderId === folderId ? { ...app, folderId: null } : app)) });
    notify(t('delete'));
  };

  const addPrompt = (data: Omit<Prompt, 'id' | 'createdAt'>) => {
    const id = `p-${Date.now().toString(36)}`;
    updateConfig({ ...config, prompts: [...(config.prompts ?? []), { id, ...data, createdAt: Date.now() }] });
    notify(t('newPrompt'));
  };

  const editPrompt = (id: string, data: Omit<Prompt, 'id' | 'createdAt'>) => {
    updateConfig({ ...config, prompts: (config.prompts ?? []).map((p) => (p.id === id ? { ...p, ...data } : p)) });
    notify(t('editPrompt'));
  };

  const deletePrompt = (id: string) => {
    updateConfig({ ...config, prompts: (config.prompts ?? []).filter((p) => p.id !== id) });
    notify(t('delete'));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'workspace-new-tab-config.json'; anchor.click();
    URL.revokeObjectURL(url);
    notify(t('exportJson'));
  };

  const importJson = async (file: File) => {
    try {
      const next = mergeConfigWithDefaults(JSON.parse(await file.text()) as Partial<AppConfig>);
      updateConfig(next);
      notify(t('importJson'));
    } catch { notify('Invalid JSON file'); }
  };

  const resetDefaults = () => {
    updateConfig(cloneDefaultConfig()); setEditing(false); setSelectedFolderId(null);
    notify(t('resetDefaults'));
  };

  const themeClass =
    config.theme === 'slate'
      ? 'bg-[radial-gradient(circle_at_18%_18%,rgba(148,163,184,0.75),transparent_23%),linear-gradient(135deg,#111827_0%,#334155_52%,#64748b_100%)]'
      : config.theme === 'ventura'
        ? 'bg-[radial-gradient(circle_at_18%_18%,rgba(255,244,187,0.75),transparent_23%),linear-gradient(135deg,#1a8fb7_0%,#71b8d5_45%,#fed7aa_100%)]'
        : 'bg-[radial-gradient(circle_at_18%_18%,rgba(255,244,187,0.95),transparent_23%),radial-gradient(circle_at_80%_14%,rgba(158,223,245,0.9),transparent_26%),radial-gradient(circle_at_54%_70%,rgba(245,165,151,0.9),transparent_32%),linear-gradient(135deg,#496bcf_0%,#71b8d5_38%,#e8b79c_72%,#f7e3bc_100%)]';

  const handleWidgetsChange = (widgets: WidgetState) => updateConfig({ ...config, widgets });

  const addSpace = (name: string, accent: string) => {
    const id = `space-${Date.now().toString(36)}`;
    const newSpace: Space = { id, name: name.trim(), accent };
    updateConfig({ ...config, spaces: [...spaces, newSpace] });
    notify('Space added');
  };

  const renameSpace = (id: string, name: string) => {
    updateConfig({ ...config, spaces: spaces.map((s) => s.id === id ? { ...s, name } : s) });
  };

  const recolorSpace = (id: string, accent: string) => {
    updateConfig({ ...config, spaces: spaces.map((s) => s.id === id ? { ...s, accent } : s) });
  };

  const deleteSpace = (id: string) => {
    if (spaces.length <= 1) { notify('Must have at least one space'); return; }
    const nextSpaces = spaces.filter((s) => s.id !== id);
    const nextCurrentId = config.currentSpaceId === id ? nextSpaces[0].id : config.currentSpaceId;
    updateConfig({
      ...config,
      spaces: nextSpaces,
      currentSpaceId: nextCurrentId,
      apps: config.apps.map((a) => a.spaceId === id ? { ...a, spaceId: undefined } : a),
      folders: config.folders.map((f) => f.spaceId === id ? { ...f, spaceId: undefined } : f),
    });
    notify('Space deleted');
  };

  const [pendingNavigatePage, setPendingNavigatePage] = useState<number | null>(null);

  const moveAppToPage = (appId: string, pageIndex: number) => {
    const isPinned = config.pinnedIds.includes(appId);
    const app = config.apps.find((a) => a.id === appId);
    if (!app) return;
    const pinnedIds = isPinned ? config.pinnedIds.filter((id) => id !== appId) : config.pinnedIds;
    const apps = config.apps.map((a) =>
      a.id === appId ? { ...a, pageIndex, spaceId: config.currentSpaceId, folderId: null } : a,
    );
    updateConfig({ ...config, apps, pinnedIds });
    setPendingNavigatePage(pageIndex);
    if (isPinned) notify('Moved to Home Screen');
  };

  // ── dnd-kit handlers ───────────────────────────────────────────────────
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
    setOverContainer(active.data.current?.container ?? null);
    clearPageFlip();
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (!over) { setOverContainer(null); return; }
    const container = over.data.current?.container ?? over.id;
    setOverContainer(container as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    clearPageFlip();
    setActiveId(null);
    setOverContainer(null);
    if (!over || !active) return;

    const draggedId = active.id as string;
    const overId    = over.id as string;
    const fromContainer = active.data.current?.container;
    const toContainer   = over.data.current?.container ?? over.id;

    const isDraggedPinned = config.pinnedIds.includes(draggedId);

    if (
      typeof fromContainer === 'string' &&
      fromContainer.startsWith(FOLDER_DROP_PREFIX) &&
      toContainer === GRID_CONTAINER_ID
    ) {
      moveOutOfFolder(draggedId);
      return;
    }

    if (typeof toContainer === 'string' && toContainer.startsWith(FOLDER_DROP_PREFIX)) {
      const folderId = toContainer.slice(FOLDER_DROP_PREFIX.length);
      const draggedIsFolder = config.folders.some((f) => f.id === draggedId);
      if (!draggedIsFolder && folderId !== draggedId) {
        moveToFolder(draggedId, folderId);
      }
      return;
    }

    if (typeof toContainer === 'string' && toContainer.startsWith(SPACE_DROP_PREFIX)) {
      const spaceId = over.data.current?.spaceId as string | undefined;
      if (spaceId) moveToSpace(draggedId, spaceId);
      return;
    }

    if (toContainer === DOCK_CONTAINER_ID) {
      if (!isDraggedPinned) {
        pinApp(draggedId);
        if (overId !== DOCK_CONTAINER_ID) {
          setTimeout(() => reorderPinnedApp(draggedId, overId), 0);
        }
      } else if (draggedId !== overId && overId !== DOCK_CONTAINER_ID) {
        reorderPinnedApp(draggedId, overId);
      }
      return;
    }

    if (fromContainer === DOCK_CONTAINER_ID && toContainer === GRID_CONTAINER_ID) {
      if (overId !== GRID_CONTAINER_ID) {
        reorderItems(draggedId, overId);
      } else {
        moveAppToEnd(draggedId);
      }
      return;
    }

    if (typeof toContainer === 'string' && (toContainer === 'edge-prev' || toContainer === 'edge-next')) {
      const targetPage = toContainer === 'edge-next'
        ? currentPageRef.current + 1
        : currentPageRef.current - 1;
      if (targetPage >= 0) moveAppToPage(draggedId, targetPage);
      return;
    }

    if (draggedId !== overId && overId !== GRID_CONTAINER_ID) {
      reorderItems(draggedId, overId);
    }
  };

  useEffect(() => {
    if (!activeId) { clearPageFlip(); return; }
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      if (e.clientX < EDGE_ZONE) {
        schedulePageFlip('prev', totalPages);
      } else if (e.clientX > w - EDGE_ZONE) {
        schedulePageFlip('next', totalPages);
      } else {
        clearPageFlip();
      }
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      clearPageFlip();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, totalPages]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={iosFolderCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div data-anim="bg" className={`absolute inset-0 ${themeClass}`} aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.38))]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.18] mix-blend-soft-light [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]" aria-hidden="true" />

        {activeId && totalPages > 1 && (
          <>
            {currentPageRef.current > 0 && (
              <div
                className="pointer-events-none fixed left-0 top-0 z-[60] h-full flex items-center justify-center"
                style={{ width: EDGE_ZONE }}
              >
                <div className="rounded-2xl bg-white/10 px-2 py-4 text-white/80 text-xs font-black backdrop-blur-md border border-white/20 flex flex-col items-center gap-1">
                  <span style={{ fontSize: 20 }}>‹</span>
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>Prev</span>
                </div>
              </div>
            )}
            {currentPageRef.current < totalPages - 1 && (
              <div
                className="pointer-events-none fixed right-0 top-0 z-[60] h-full flex items-center justify-center"
                style={{ width: EDGE_ZONE }}
              >
                <div className="rounded-2xl bg-white/10 px-2 py-4 text-white/80 text-xs font-black backdrop-blur-md border border-white/20 flex flex-col items-center gap-1">
                  <span style={{ fontSize: 20 }}>›</span>
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Next</span>
                </div>
              </div>
            )}
          </>
        )}

        <TopBar
          data-anim="topbar"
          spaces={spaces}
          currentSpaceId={config.currentSpaceId}
          editing={editing}
          syncStatus=""
          glass={config.glass}
          t={t}
          widgets={config.widgets}
          onSpaceChange={switchSpace}
          onSearchClick={() => setSearchOpen(true)}
          onSettingsClick={() => setSettingsOpen(true)}
          onToggleEditing={() => setEditing((v) => !v)}
          onToggleTheme={() => {
            const themes = ['sonoma', 'ventura', 'slate'] as const;
            const index = themes.indexOf(config.theme as 'sonoma' | 'ventura' | 'slate');
            updateConfig({ ...config, theme: themes[(index + 1) % themes.length] });
          }}
          onWidgetsChange={handleWidgetsChange}
        />

        <AiPortalBar
          data-anim="aibar"
          portals={aiPortals}
          glass={config.glass}
          size={config.aiPortalSize ?? AI_PORTAL_SIZE_DEFAULT}
          t={t}
        />

        <button
          type="button"
          data-anim="prompts-btn"
          onClick={() => setShowPrompts((v) => !v)}
          aria-label={t('promptLibrary')}
          className="fixed left-4 top-1/2 z-30 -translate-y-1/2 flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-white/70 shadow-lg transition hover:text-white"
          style={glassBtn(config.glass, showPrompts)}
        >
          <BookMarked className="h-5 w-5" aria-hidden="true" />
          <span
            className="text-[0.6rem] font-black uppercase tracking-widest"
            style={{ writingMode: 'vertical-rl' }}
          >
            {t('prompts')}
          </span>
        </button>

        {showPrompts ? (
          <PromptLibrary
            prompts={config.prompts ?? []}
            glass={config.glass}
            t={t as (key: string) => string}
            onClose={() => setShowPrompts(false)}
            onAdd={addPrompt}
            onEdit={editPrompt}
            onDelete={deletePrompt}
          />
        ) : (
          <AppGrid
            apps={currentSpaceApps}
            folders={currentSpaceFolders}
            editing={editing}
            selectedFolderId={selectedFolderId}
            gridColumns={config.gridColumns}
            gridRows={config.gridRows}
            currentSpaceId={config.currentSpaceId}
            spaces={spaces}
            spaceDirection={spaceDirection}
            pendingNavigatePage={pendingNavigatePage ?? externalPage}
            onNavigated={() => {
              setPendingNavigatePage(null);
              setExternalPage(null);
            }}
            onPageChange={(p) => { currentPageRef.current = p; }}
            t={t}
            activeId={activeId}
            overContainer={overContainer}
            onOpenFolder={setSelectedFolderId}
            onCloseFolder={() => setSelectedFolderId(null)}
            onStartEditing={() => setEditing(true)}
            onStopEditing={() => setEditing(false)}
            onDeleteApp={deleteApp}
            onRenameApp={renameShortcut}
            onAddShortcut={openShortcutEditor}
            onAddFolder={addFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onReorder={reorderItems}
            onMoveToEnd={moveAppToEnd}
            onMoveToPage={moveAppToPage}
            onMoveToFolder={moveToFolder}
            onMoveOutOfFolder={moveOutOfFolder}
            onMoveToSpace={moveToSpace}
          />
        )}

        {config.showDock && (
          <Dock
            data-anim="dock"
            pinnedApps={pinnedApps}
            recentTabs={recentTabs}
            editing={editing}
            glass={config.glass}
            activeId={activeId}
            overContainer={overContainer}
            onDropApp={pinApp}
            onUnpinApp={unpinApp}
            onRenameApp={renameShortcut}
            onReorderPinned={reorderPinnedApp}
          />
        )}

        {config.showWidgets && !showPrompts && (
          <Widgets
            data-anim="widgets"
            widgets={config.widgets}
            glass={config.glass}
            onChange={handleWidgetsChange}
            t={t}
          />
        )}

        {config.widgets.focusModeActive && (
          <FocusModeOverlay
            widgets={config.widgets}
            onChange={handleWidgetsChange}
            backgroundClass={themeClass}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            open={settingsOpen}
            config={config}
            spaces={spaces}
            t={t}
            onClose={() => setSettingsOpen(false)}
            onConfigChange={updateConfig}
            onAction={notify}
            onExportJson={exportJson}
            onImportJson={importJson}
            onResetDefaults={resetDefaults}
            onAddSpace={addSpace}
            onRenameSpace={renameSpace}
            onRecolorSpace={recolorSpace}
            onDeleteSpace={deleteSpace}
          />
        )}

        <SpotlightSearch
          open={searchOpen}
          apps={allApps}
          engines={config.searchEngines}
          defaultEngine={config.defaultEngine ?? 'google'}
          todos={config.widgets.todos}
          noteTabs={config.widgets.noteTabs}
          prompts={config.prompts ?? []}
          t={t}
          onClose={() => setSearchOpen(false)}
          onEngineChange={(engineId) => updateConfig({ ...config, defaultEngine: engineId })}
        />

        {editor.open && (
          <ShortcutEditor
            open={editor.open}
            mode={editor.mode}
            initialApp={editingApp}
            folderId={editor.folderId}
            t={t}
            onSave={(shortcut) => { saveShortcut(shortcut); setEditor({ open: false, mode: 'add', appId: null, folderId: null }); }}
            onClose={() => setEditor({ open: false, mode: 'add', appId: null, folderId: null })}
          />
        )}

        <Toast message={toast} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? (
          <div style={{ width: 72, height: 72, opacity: 0.85, transform: 'scale(1.08)', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))' }}>
            <AppIcon app={activeApp} size="grid" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default NewTab;
