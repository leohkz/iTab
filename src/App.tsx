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
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [toast, setToast] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({
    open: false,
    mode: 'add',
    appId: null,
    folderId: null,
  });

  const t = useMemo(() => createTranslator(config.locale), [config.locale]);
  const editingApp = config.apps.find((app) => app.id === editor.appId) ?? null;
  const pinnedApps = useMemo(
    () => config.pinnedIds.map((id) => config.apps.find((app) => app.id === id)).filter((app): app is AppShortcut => Boolean(app)),
    [config.apps, config.pinnedIds],
  );

  const updateConfig = (next: AppConfig) => {
    const enabledEngines = next.searchEngines.filter((engine) => engine.enabled);
    const normalized: AppConfig = {
      ...next,
      defaultEngine: enabledEngines.some((engine) => engine.id === next.defaultEngine)
        ? next.defaultEngine
        : (enabledEngines[0]?.id ?? next.searchEngines[0]?.id ?? 'google'),
      gridColumns: Math.min(10, Math.max(4, Number(next.gridColumns) || 7)),
      gridRows: Math.min(7, Math.max(3, Number(next.gridRows) || 4)),
      glass: Math.min(95, Math.max(30, Number(next.glass) || 72)),
    };
    setConfig(normalized);
    if (isChromeExtensionApiAvailable()) {
      chrome.storage.local.set({ [CONFIG_KEY]: normalized });
    }
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
      if (isCommandK && config.experiments.keyboardShortcuts) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setSearchOpen(false);
        setSelectedFolderId(null);
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
        const next = {
          ...current,
          widgets: {
            ...current.widgets,
            pomodoroRemainingSeconds: remaining,
            pomodoroRunning: remaining > 0,
          },
        };
        if (isChromeExtensionApiAvailable()) {
          chrome.storage.local.set({ [CONFIG_KEY]: next });
        }
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
      updateConfig({
        ...config,
        apps: config.apps.map((app) => (app.id === editor.appId ? { ...app, ...shortcut } : app)),
      });
      notify('Shortcut updated');
      setEditing(false);
      return;
    }

    const id = `${shortcut.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    updateConfig({ ...config, apps: [...config.apps, { id, ...shortcut }] });
    notify('Shortcut added');
  };

  const deleteApp = (appId: string) => {
    updateConfig({
      ...config,
      apps: config.apps.filter((app) => app.id !== appId),
      pinnedIds: config.pinnedIds.filter((id) => id !== appId),
    });
    notify('Shortcut removed');
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

  const syncBookmarks = () => {
    setSyncStatus(t('syncing'));
    if (typeof chrome !== 'undefined' && chrome.bookmarks?.getTree) {
      chrome.bookmarks.getTree((tree) => {
        const imported: AppShortcut[] = [];
        const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
          nodes.forEach((node) => {
            if (node.url && imported.length < 12) {
              imported.push({
                id: `bookmark-${node.id}`,
                name: node.title || node.url,
                url: node.url,
                folderId: null,
                iconType: 'api',
                iconValue: node.url,
              });
            }
            if (node.children) walk(node.children);
          });
        };
        walk(tree);
        updateConfig({ ...config, apps: [...config.apps, ...imported.filter((item) => !config.apps.some((app) => app.url === item.url))] });
        setSyncStatus(t('synced'));
        notify(`${imported.length} bookmarks imported`);
      });
      return;
    }

    const sample: AppShortcut = {
      id: `bookmark-demo-${Date.now().toString(36)}`,
      name: 'Chrome Bookmark',
      url: 'https://www.google.com/bookmarks',
      folderId: null,
      iconType: 'api',
      iconValue: 'https://www.google.com',
    };
    updateConfig({ ...config, apps: [...config.apps, sample] });
    window.setTimeout(() => setSyncStatus(t('synced')), 800);
    notify('Dev preview: sample bookmark imported');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'workspace-new-tab-config.json';
    anchor.click();
    URL.revokeObjectURL(url);
    notify('JSON exported');
  };

  const importJson = async (file: File) => {
    try {
      const next = mergeConfigWithDefaults(JSON.parse(await file.text()) as Partial<AppConfig>);
      updateConfig(next);
      notify('JSON imported');
    } catch {
      notify('Invalid JSON file');
    }
  };

  const resetDefaults = () => {
    updateConfig(cloneDefaultConfig());
    setEditing(false);
    setSelectedFolderId(null);
    notify('Defaults restored');
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
        syncStatus={syncStatus === 'Synced' ? t('synced') : syncStatus}
        glass={config.glass}
        onSpaceChange={(spaceId) => updateConfig({ ...config, currentSpaceId: spaceId })}
        onSearchClick={() => setSearchOpen(true)}
        onSyncBookmarks={syncBookmarks}
        onSettingsClick={() => setSettingsOpen(true)}
        onToggleEditing={() => setEditing((value) => !value)}
        onToggleTheme={() => {
          const themes = ['sonoma', 'ventura', 'slate'] as const;
          const index = themes.indexOf(config.theme);
          updateConfig({ ...config, theme: themes[(index + 1) % themes.length] });
        }}
      />

      <AppGrid
        apps={config.apps}
        folders={config.folders}
        editing={editing}
        selectedFolderId={selectedFolderId}
        gridColumns={config.gridColumns}
        gridRows={config.gridRows}
        onOpenFolder={setSelectedFolderId}
        onCloseFolder={() => setSelectedFolderId(null)}
        onStartEditing={() => setEditing(true)}
        onDeleteApp={deleteApp}
        onRenameApp={renameShortcut}
        onAddShortcut={openShortcutEditor}
        onReorder={reorderItems}
        onMoveToFolder={moveToFolder}
        onMoveOutOfFolder={moveOutOfFolder}
      />

      {config.experiments.smartRecommendations ? (
        <div className="fixed left-5 top-24 z-20 w-64 rounded-[1.35rem] border border-white/20 bg-white/18 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md max-xl:hidden" data-testid="panel-smart-recommendations">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Suggested now</p>
          <div className="mt-3 grid gap-2">
            {(config.apps.find((app) => app.id === 'gmail') ? [config.apps.find((app) => app.id === 'gmail')!] : config.apps.slice(0, 1)).map((app) => (
              <a key={app.id} href={app.url} target="_blank" rel="noreferrer" className="rounded-xl bg-white/12 px-3 py-2 text-sm font-black transition hover:bg-white/20">
                {app.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {config.experiments.conflictWarning ? (
        <div className="fixed bottom-24 left-5 z-20 max-w-72 rounded-2xl border border-white/18 bg-slate-950/28 px-4 py-3 text-xs font-bold text-white/76 shadow-lg backdrop-blur-md max-xl:hidden" data-testid="panel-conflict-warning">
          Only one Chrome extension can control New Tab at a time.
        </div>
      ) : null}

      {config.showDock ? <Dock pinnedApps={pinnedApps} recentTabs={config.experiments.recentVisits ? recentTabs : []} editing={editing} glass={config.glass} onDropApp={pinApp} /> : null}
      {config.showWidgets ? <Widgets widgets={config.widgets} glass={config.glass} t={t} onChange={(widgets) => updateConfig({ ...config, widgets })} /> : null}

      <SpotlightSearch
        open={searchOpen}
        apps={config.apps}
        engines={config.searchEngines}
        defaultEngine={config.defaultEngine}
        onClose={() => setSearchOpen(false)}
        onEngineChange={(engine) => updateConfig({ ...config, defaultEngine: engine })}
      />

      <SettingsModal
        open={settingsOpen}
        config={config}
        t={t}
        onClose={() => setSettingsOpen(false)}
        onConfigChange={updateConfig}
        onAction={notify}
        onSyncBookmarks={syncBookmarks}
        onExportJson={exportJson}
        onImportJson={importJson}
        onResetDefaults={resetDefaults}
      />

      <ShortcutEditor
        open={editor.open}
        mode={editor.mode}
        initialApp={editingApp}
        folderId={editor.folderId}
        onClose={() => setEditor((current) => ({ ...current, open: false }))}
        onSave={saveShortcut}
      />

      <Toast message={toast} />
    </div>
  );
}

export default NewTab;
