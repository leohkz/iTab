import { BotMessageSquare, Database, Download, FlaskConical, LayoutGrid, Layers, Palette, Plus, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { AppConfig, AiPortal, Locale, SearchEngine, SearchEngineId, Space, ThemeName } from '../types';
import { SPACE_ACCENTS } from '../types';
import type { TranslationKey } from '../i18n';
import { AiPortalSettingsPanel } from './AiPortalBar';

type SettingsModalProps = {
  open: boolean;
  config: AppConfig;
  spaces: Space[];
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onConfigChange: (config: AppConfig) => void;
  onAction: (message: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetDefaults: () => void;
  onAddSpace: (name: string, accent: string) => void;
  onRenameSpace: (id: string, name: string) => void;
  onRecolorSpace: (id: string, accent: string) => void;
  onDeleteSpace: (id: string) => void;
};

const categories = [
  { id: 'appearance', key: 'appearance', icon: Palette },
  { id: 'layout',     key: 'layout',     icon: LayoutGrid },
  { id: 'spaces',     key: 'spaces',     icon: Layers },
  { id: 'search',     key: 'search',     icon: Search },
  { id: 'aiportals',  key: 'aiportals',  icon: BotMessageSquare },
  { id: 'data',       key: 'data',       icon: Database },
  { id: 'experiments',key: 'experiments',icon: FlaskConical },
] as const;

type CategoryId = (typeof categories)[number]['id'];

const experimentKeys: Array<[keyof AppConfig['experiments'], TranslationKey]> = [
  ['recentVisits',     'recentVisits'],
  ['keyboardShortcuts','keyboardShortcuts'],
];

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={['relative h-8 w-14 rounded-full transition duration-200', checked ? 'bg-slate-950' : 'bg-slate-300'].join(' ')}
      data-testid={testId}
    >
      <span className={['absolute top-1 h-6 w-6 rounded-full bg-white shadow transition duration-200', checked ? 'left-7' : 'left-1'].join(' ')} />
    </button>
  );
}

function ResetConfirmDialog({ t, onConfirm, onCancel }: {
  t: (k: TranslationKey) => string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-80 rounded-[1.6rem] bg-white p-6 shadow-2xl">
        <p className="mb-1 text-base font-black text-slate-800">{t('resetDefaults')}?</p>
        <p className="mb-5 text-sm text-slate-500">{t('confirmReset')}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
            {t('cancel')}
          </button>
          <button type="button" onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white hover:bg-red-600">
            {t('resetDefaults')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Spaces Panel ────────────────────────────────────────────────────────
function SpacesPanel({
  spaces, onAdd, onRename, onRecolor, onDelete,
}: {
  spaces: Space[];
  onAdd: (name: string, accent: string) => void;
  onRename: (id: string, name: string) => void;
  onRecolor: (id: string, accent: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newAccent, setNewAccent] = useState<string>(SPACE_ACCENTS[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newAccent);
    setNewName('');
    setNewAccent(SPACE_ACCENTS[0].value);
  };

  const startEdit = (space: Space) => {
    setEditingId(space.id);
    setEditingName(space.name);
  };

  const commitEdit = (id: string) => {
    if (editingName.trim()) onRename(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-black">Spaces</h4>
        <div className="grid gap-2">
          {spaces.map((space) => (
            <div key={space.id} className="flex items-center gap-3 rounded-xl bg-slate-950/5 px-3 py-2.5">
              <div className="relative flex-shrink-0">
                <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${space.accent}`} />
                <select
                  value={space.accent}
                  onChange={(e) => onRecolor(space.id, e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  title="Change colour"
                >
                  {SPACE_ACCENTS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              {editingId === space.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitEdit(space.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(space.id); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm font-bold outline-none focus:border-slate-950"
                />
              ) : (
                <span
                  className="flex-1 cursor-pointer text-sm font-bold hover:text-slate-600"
                  onDoubleClick={() => startEdit(space)}
                  title="Double-click to rename"
                >
                  {space.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => startEdit(space)}
                className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                改名
              </button>
              <button
                type="button"
                onClick={() => onDelete(space.id)}
                disabled={spaces.length <= 1}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                title="Delete space"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-black">新增 Space</h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${newAccent}`} />
            <select
              value={newAccent}
              onChange={(e) => setNewAccent(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {SPACE_ACCENTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Space 名稱"
            className="h-10 flex-1 rounded-xl border border-slate-950/10 px-3 text-sm font-bold outline-none focus:border-slate-950"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> 新增
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">點色塊可更換顏色 · 雙擊名稱可改名</p>
      </div>
    </div>
  );
}

export function SettingsModal({
  open, config, spaces, t, onClose, onConfigChange, onAction,
  onExportJson, onImportJson, onResetDefaults,
  onAddSpace, onRenameSpace, onRecolorSpace, onDeleteSpace,
}: SettingsModalProps) {
  const [active, setActive] = useState<CategoryId>('appearance');
  const [newEngine, setNewEngine] = useState({ name: '', shortcut: '', template: '' });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const title = useMemo(() => categories.find((c) => c.id === active)?.key ?? 'settings', [active]);

  if (!open) return null;

  const updateEngine = (engineId: SearchEngineId, patch: Partial<SearchEngine>) =>
    onConfigChange({ ...config, searchEngines: config.searchEngines.map((e) => e.id === engineId ? { ...e, ...patch } : e) });

  const addEngine = () => {
    if (!newEngine.name.trim() || !newEngine.shortcut.trim() || !newEngine.template.includes('{q}')) {
      onAction('Search template must include {q}');
      return;
    }
    const id = `custom-${Date.now().toString(36)}`;
    onConfigChange({
      ...config,
      searchEngines: [...config.searchEngines, { id, name: newEngine.name.trim(), shortcut: newEngine.shortcut.trim(), template: newEngine.template.trim(), enabled: true }],
      defaultEngine: config.defaultEngine || id,
    });
    setNewEngine({ name: '', shortcut: '', template: '' });
    onAction(t('addCustomEngine'));
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-slate-950/42 px-4 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <section
          role="dialog" aria-modal="true" aria-labelledby="settings-title"
          className="grid h-[min(44rem,calc(100vh-3rem))] w-[min(66rem,calc(100vw-2rem))] grid-cols-[16rem_1fr] overflow-hidden rounded-[1.45rem] border border-white/35 bg-[#f5f3ee] text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.38),inset_0_1px_0_rgba(255,255,255,0.72)] max-md:grid-cols-1"
          data-testid="modal-settings"
        >
          <aside className="border-r border-slate-950/10 bg-[#eef3f3] p-4 max-md:hidden">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">System</p>
                <h2 id="settings-title" className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">{t('settings')}</h2>
              </div>
              <button type="button" aria-label={t('settings')} onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-950/8 text-slate-700"
                data-testid="button-close-settings">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1" aria-label="Settings categories">
              {categories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setActive(cat.id)}
                  className={['flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black transition duration-200', active === cat.id ? 'bg-slate-950/10 text-slate-950' : 'text-slate-600 hover:bg-slate-950/6'].join(' ')}
                  data-testid={`button-settings-${cat.id}`}>
                  <cat.icon className="h-4 w-4" />
                  {cat.id === 'spaces' ? 'Spaces' : cat.id === 'aiportals' ? 'AI 入口' : t(cat.key as TranslationKey)}
                </button>
              ))}
            </nav>
          </aside>

          <div className="overflow-auto bg-[#f6f2ea] p-6">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  {active === 'spaces' ? 'SPACES' : active === 'aiportals' ? 'AI 入口' : t(title as TranslationKey)}
                </p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.05em] text-slate-950">{t('settings')}</h3>
              </div>
              <button type="button" aria-label={t('settings')} onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/8 text-slate-700 md:hidden"
                data-testid="button-close-settings-mobile">
                <X className="h-4 w-4" />
              </button>
            </div>

            {active === 'appearance' && (
              <div className="grid gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <label className="block text-sm font-black text-slate-700">
                    {t('language')}
                    <select value={config.locale} onChange={(e) => onConfigChange({ ...config, locale: e.target.value as Locale })}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-950/10 bg-white px-3 text-sm font-bold"
                      data-testid="select-language">
                      <option value="en">English</option>
                      <option value="zh-Hant">繁體中文</option>
                      <option value="zh-Hans">简体中文</option>
                    </select>
                  </label>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-black tracking-[-0.03em]">{t('glassIntensity')}</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{t('glassIntensityDesc')}</p>
                    </div>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{config.glass}%</span>
                  </div>
                  <input type="range" min="30" max="95" value={config.glass}
                    onChange={(e) => onConfigChange({ ...config, glass: Number(e.target.value) })}
                    className="mt-4 w-full accent-slate-950" data-testid="input-glass" />
                </div>
                <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                  {(['sonoma', 'ventura', 'slate'] as ThemeName[]).map((themeName, i) => (
                    <button key={themeName} type="button" onClick={() => onConfigChange({ ...config, theme: themeName })}
                      className={['rounded-2xl bg-white p-3 text-left shadow-sm transition duration-200 hover:bg-slate-50', config.theme === themeName ? 'ring-2 ring-slate-950' : ''].join(' ')}
                      data-testid={`button-theme-${themeName}`}>
                      <span className={['mb-3 block h-20 rounded-xl', i === 0 ? 'bg-[radial-gradient(circle_at_20%_20%,#fff7c2,transparent_32%),linear-gradient(135deg,#4676d7,#d49d8c)]' : i === 1 ? 'bg-[linear-gradient(135deg,#1a8fb7,#fed7aa)]' : 'bg-[linear-gradient(135deg,#111827,#64748b)]'].join(' ')} />
                      <span className="block text-sm font-black capitalize">{themeName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active === 'layout' && (
              <div className="grid gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <h4 className="font-black">{t('gridSize')}</h4>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-sm font-bold">
                      {t('columns')}
                      <input type="number" min="4" max="10" value={config.gridColumns}
                        onChange={(e) => onConfigChange({ ...config, gridColumns: Number(e.target.value) })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-950/10 px-3" data-testid="input-grid-columns" />
                    </label>
                    <label className="text-sm font-bold">
                      {t('rows')}
                      <input type="number" min="3" max="7" value={config.gridRows}
                        onChange={(e) => onConfigChange({ ...config, gridRows: Number(e.target.value) })}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-950/10 px-3" data-testid="input-grid-rows" />
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div><h4 className="font-black">{t('showDock')}</h4><p className="text-sm font-semibold text-slate-600">{t('showDockDesc')}</p></div>
                  <Toggle checked={config.showDock} onChange={(v) => onConfigChange({ ...config, showDock: v })} testId="toggle-show-dock" />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div><h4 className="font-black">{t('showWidgets')}</h4><p className="text-sm font-semibold text-slate-600">{t('showWidgetsDesc')}</p></div>
                  <Toggle checked={config.showWidgets} onChange={(v) => onConfigChange({ ...config, showWidgets: v })} testId="toggle-show-widgets" />
                </div>
              </div>
            )}

            {active === 'spaces' && (
              <SpacesPanel
                spaces={spaces}
                onAdd={onAddSpace}
                onRename={onRenameSpace}
                onRecolor={onRecolorSpace}
                onDelete={onDeleteSpace}
              />
            )}

            {active === 'search' && (
              <div className="grid gap-4">
                <label className="block rounded-2xl bg-white p-4 text-sm font-black shadow-sm">
                  {t('defaultEngine')}
                  <select value={config.defaultEngine}
                    onChange={(e) => onConfigChange({ ...config, defaultEngine: e.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-950/10 bg-white px-3 text-sm font-bold"
                    data-testid="select-default-engine">
                    {config.searchEngines.filter((e) => e.enabled).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </label>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <h4 className="font-black">{t('searchEngines')}</h4>
                  <div className="mt-3 grid gap-2">
                    {config.searchEngines.map((engine) => (
                      <div key={engine.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-slate-950/5 p-3">
                        <Toggle checked={engine.enabled} onChange={(v) => updateEngine(engine.id, { enabled: v })} testId={`toggle-engine-${engine.id}`} />
                        <div>
                          <p className="text-sm font-black">{engine.name} <span className="text-slate-500">/{engine.shortcut}</span></p>
                          <p className="truncate text-xs font-semibold text-slate-500">{engine.template}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <h4 className="font-black">{t('addCustomEngine')}</h4>
                  <div className="mt-3 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
                    <input value={newEngine.name} onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })} placeholder={t('name')} className="h-10 rounded-xl border border-slate-950/10 px-3 text-sm font-bold" data-testid="input-engine-name" />
                    <input value={newEngine.shortcut} onChange={(e) => setNewEngine({ ...newEngine, shortcut: e.target.value })} placeholder="Shortcut" className="h-10 rounded-xl border border-slate-950/10 px-3 text-sm font-bold" data-testid="input-engine-shortcut" />
                    <input value={newEngine.template} onChange={(e) => setNewEngine({ ...newEngine, template: e.target.value })} placeholder="https://example.com?q={q}" className="h-10 rounded-xl border border-slate-950/10 px-3 text-sm font-bold" data-testid="input-engine-template" />
                  </div>
                  <button type="button" onClick={addEngine}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white"
                    data-testid="button-add-engine">
                    <Plus className="h-4 w-4" />{t('add')}
                  </button>
                </div>
              </div>
            )}

            {active === 'aiportals' && (
              <AiPortalSettingsPanel
                portals={config.aiPortals ?? []}
                onChange={(portals: AiPortal[]) => onConfigChange({ ...config, aiPortals: portals })}
              />
            )}

            {active === 'data' && (
              <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                <button type="button" onClick={onExportJson}
                  className="rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                  data-testid="button-export-json">
                  <Download className="mb-4 h-5 w-5" /><span className="font-black">{t('exportJson')}</span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                  data-testid="button-import-json">
                  <Upload className="mb-4 h-5 w-5" /><span className="font-black">{t('importJson')}</span>
                </button>
                <button type="button" onClick={() => setShowResetConfirm(true)}
                  className="rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-red-50"
                  data-testid="button-reset-defaults">
                  <RotateCcw className="mb-4 h-5 w-5 text-red-500" />
                  <span className="font-black text-red-600">{t('resetDefaults')}</span>
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportJson(f); }}
                  data-testid="input-import-json-file" />
              </div>
            )}

            {active === 'experiments' && (
              <div className="grid gap-3">
                {experimentKeys.map(([key, labelKey]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                    <div>
                      <h4 className="font-black">{t(labelKey)}</h4>
                      <p className="text-sm font-semibold text-slate-600">{t('experimentDesc')}</p>
                    </div>
                    <Toggle
                      checked={config.experiments[key]}
                      onChange={(v) => onConfigChange({ ...config, experiments: { ...config.experiments, [key]: v } })}
                      testId={`toggle-experiment-${key}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {showResetConfirm && (
        <ResetConfirmDialog
          t={t}
          onConfirm={() => { onResetDefaults(); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </>
  );
}
