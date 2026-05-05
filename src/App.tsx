import { useEffect, useMemo, useState } from 'react';
import { AppGrid } from './components/AppGrid';
import { Dock } from './components/Dock';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutEditor } from './components/ShortcutEditor';
import { SpotlightSearch } from './components/SpotlightSearch';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { Widgets } from './components/Widgets';
import { defaultConfig, recentTabs, spaces } from './data/mockStore';
import { createTranslator } from './i18n';
import type { AppConfig, AppShortcut } from './types';

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

function mergeConfigWithDefaults(config: Partial<AppConfig>): AppConfig {
  const fallback = cloneDefaultConfig();
  const widgets = { ...fallback.widgets, ...(config.widgets ?? {}) };
  if (!widgets.pomodoroRemainingSeconds) {
    widgets.pomodoroRemainingSeconds = widgets.pomodoroMinutes * 60;
  }
  return {
    ...fallback,
    ...config,
    apps: config.apps ?? fallback.apps,
    folders: config.folders ?? fallback.folders,
    pinnedIds: config.pinnedIds ?? fallback.pinnedIds,
    searchEngines: config.searchEngines ?? fallback.searchEngines,
    widgets,
    experiments: { ...fallback.experiments, ...(config.experiments ?? {}) },
  };
}

function isChromeExtensionApiAvailable() {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function NewTab() {
  const [config, setConfig] = useState<AppConfig>(() => cloneDefaultConfig());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    open: false, mode: 'add', appId: null, folderId: null,
  });

  const t = useMemo(() => createTranslator(config.locale), [config.locale]);
  const editingApp = config.apps.find((app) => app.id === editor.appId) ?? null;
  const pinnedApps = useMemo(
    () => config.pinnedIds.map((id) => config.apps.find((app) => app.id === id)).filter((app): app is AppShortcut => Boolean(app)),
    [config.apps, config.pinnedIds],
  );

  // Filter apps by current space: apps without spaceId belong to all spaces
  const currentSpaceApps = useMemo(
    () => config.apps.filter((app) => !app.spaceId || app.spaceId === config.currentSpaceId),
    [config.apps, config.currentSpaceId],
  );

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

  useEffect(() => {
    if (isChromeExtensionApiAvailable()) {
      chrome.storage.local.get(CONFIG_KEY, (result) => {
        if (result[CONFIG_KEY]) setConfig(mergeConfigWithDefaults(result[CONFIG_KEY] as Partial<AppConfig>));
      });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isCommandK && config.experiments.keyboardShortcuts) { event.preventDefault(); setSearchOpen(true); }
      if (event.key === 'Escape') {
        setSettingsOpen(false); setSearchOpen(false); setSelectedFolderId(null); setEditing(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [config.experiments.keyboardShortcuts]);

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
      setEditing(false);
      return;
    }
    const id = `${shortcut.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    // New app belongs to current space
    updateConfig({ ...config, apps: [...config.apps, { id, ...shortcut, spaceId: config.currentSpaceId }] });
    notify(t('addWebsite'));
  };

  const deleteApp = (appId: string) => {
    updateConfig({
      ...config,
      apps: config.apps.filter((app) => app.id !== appId),
      pinnedIds: config.pinnedIds.filter((id) => id !== appId),
    });
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

  const reorderItems = (draggedId: string, targetId: string) => {
    const draggedIndex = config.apps.findIndex((app) => app.id === draggedId);
    const targetIndex = config.apps.findIndex((app) => app.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const next = [...config.apps];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, dragged);
    updateConfig({ ...config, apps: next });
  };

  const moveToFolder = (appId: string, folderId: string) => {
    if (!config.apps.some((app) => app.id === appId)) return;
    updateConfig({ ...config, apps: config.apps.map((app) => (app.id === appId ? { ...app, folderId } : app)) });
    notify('Moved to folder');
  };

  const moveOutOfFolder = (appId: string) => {
    updateConfig({ ...config, apps: config.apps.map((app) => (app.id === appId ? { ...app, folderId: null } : app)) });
    notify('Moved to Home Screen');
  };

  const addFolder = () => {
    const id = `folder-${Date.now().toString(36)}`;
    updateConfig({ ...config, folders: [...config.folders, { id, name: t('newFolder') }] });
    notify(t('newFolder'));
  };

  const renameFolder = (folderId: string, name: string) => {
    updateConfig({ ...config, folders: config.folders.map((f) => (f.id === folderId ? { ...f, name } : f)) });
    notify(t('renameFolder'));
  };

  const deleteFolder = (folderId: string) => {
    updateConfig({
      ...config,
      folders: config.folders.filter((f) => f.id !== folderId),
      apps: config.apps.map((app) => (app.folderId === folderId ? { ...app, folderId: null } : app)),
    });
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className={`absolute inset-0 ${themeClass}`} aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.38))]" aria-hidden="true" />
      <div className="absolute inset-0 opacity-[0.18] mix-blend-soft-light [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]" aria-hidden="true" />

      <TopBar
        spaces={spaces}
        currentSpaceId={config.currentSpaceId}
        editing={editing}
        syncStatus=""
        glass={config.glass}
        t={t}
        onSpaceChange={(spaceId) => updateConfig({ ...config, currentSpaceId: spaceId })}
        onSearchClick={() => setSearchOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
        onToggleEditing={() => setEditing((v) => !v)}
        onToggleTheme={() => {
          const themes = ['sonoma', 'ventura', 'slate'] as const;
          const index = themes.indexOf(config.theme);
          updateConfig({ ...config, theme: themes[(index + 1) % themes.length] });
        }}
      />

      <AppGrid
        apps={currentSpaceApps}
        folders={config.folders}
        editing={editing}
        selectedFolderId={selectedFolderId}
        gridColumns={config.gridColumns}
        gridRows={config.gridRows}
        t={t}
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
        onMoveToFolder={moveToFolder}
        onMoveOutOfFolder={moveOutOfFolder}
      />

      <Dock
        pinnedApps={pinnedApps}
        recentTabs={recentTabs}
        editing={editing}
        glass={config.glass}
        onDropApp={pinApp}
        onUnpinApp={unpinApp}
        onRenameApp={renameShortcut}
      />

      {config.showWidgets && (
        <Widgets
          widgets={config.widgets}
          glass={config.glass}
          onChange={(widgets) => updateConfig({ ...config, widgets })}
          t={t}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          config={config}
          t={t}
          onClose={() => setSettingsOpen(false)}
          onConfigChange={updateConfig}
          onAction={notify}
          onSyncBookmarks={() => notify('Bookmarks synced')}
          onExportJson={exportJson}
          onImportJson={importJson}
          onResetDefaults={resetDefaults}
        />
      )}

      {searchOpen && (
        <SpotlightSearch
          open={searchOpen}
          apps={config.apps}
          engines={config.searchEngines}
          defaultEngine={config.defaultEngine}
          onClose={() => setSearchOpen(false)}
          onEngineChange={(engineId) => updateConfig({ ...config, defaultEngine: engineId })}
        />
      )}

      {editor.open && (
        <ShortcutEditor
          open={editor.open}
          mode={editor.mode}
          initialApp={editingApp}
          folderId={editor.folderId}
          onSave={(shortcut) => { saveShortcut(shortcut); setEditor({ open: false, mode: 'add', appId: null, folderId: null }); }}
          onClose={() => setEditor({ open: false, mode: 'add', appId: null, folderId: null })}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

export default NewTab;
