import { ChevronRight, Download, Globe, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { AppConfig, SearchEngine } from '../types';
import type { TranslationKey } from '../i18n';

type SettingsModalProps = {
  open: boolean;
  config: AppConfig;
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onConfigChange: (config: AppConfig) => void;
  onAction: (msg: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetDefaults: () => void;
};

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={['relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200', checked ? 'bg-slate-700' : 'bg-slate-200'].join(' ')}
    >
      <span className={['absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-4' : 'translate-x-0.5'].join(' ')} />
    </button>
  );
}

type Section = 'appearance' | 'layout' | 'engines' | 'widgets' | 'experiments' | 'data';

export function SettingsModal({ open, config, t, onClose, onConfigChange, onExportJson, onImportJson, onResetDefaults }: SettingsModalProps) {
  const [section, setSection] = useState<Section>('appearance');
  const [newEngine, setNewEngine] = useState({ name: '', shortcut: '', template: '' });

  if (!open) return null;

  const update = (patch: Partial<AppConfig>) => onConfigChange({ ...config, ...patch });

  const updateEngine = (id: string, patch: Partial<SearchEngine>) =>
    update({ searchEngines: config.searchEngines.map((e) => e.id === id ? { ...e, ...patch } : e) });

  const addEngine = () => {
    if (!newEngine.name.trim() || !newEngine.template.trim()) return;
    const id = `engine-${Date.now().toString(36)}`;
    update({
      searchEngines: [...config.searchEngines, {
        id,
        name: newEngine.name.trim(),
        shortcut: newEngine.shortcut.trim(),
        template: newEngine.template.trim(),
        enabled: true,
      }],
      defaultEngine: config.defaultEngine || id,
    });
    setNewEngine({ name: '', shortcut: '', template: '' });
  };

  const removeEngine = (id: string) =>
    update({ searchEngines: config.searchEngines.filter((e) => e.id !== id) });

  const navItem = (s: Section, label: string) => (
    <button
      key={s} type="button"
      onClick={() => setSection(s)}
      className={['flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition', section === s ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-black/8'].join(' ')}
    >
      {label}
      {section === s ? <ChevronRight className="h-3.5 w-3.5" /> : null}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)' }}
      >
        {/* Sidebar */}
        <div className="flex w-44 shrink-0 flex-col gap-1 border-r border-black/8 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('settings')}</p>
            <button type="button" onClick={onClose} className="grid h-6 w-6 place-items-center rounded-full text-slate-400 transition hover:bg-black/8 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
          </div>
          {navItem('appearance', t('appearance'))}
          {navItem('layout', t('layout'))}
          {navItem('engines', t('searchEngines'))}
          {navItem('widgets', t('widgets'))}
          {navItem('experiments', t('experiments'))}
          {navItem('data', t('data'))}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">

          {section === 'appearance' && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('appearance')}</h3>
              <div className="flex flex-col gap-2 rounded-2xl bg-black/4 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">{t('theme')}</p>
                <div className="flex gap-2">
                  {(['sonoma','ventura','slate'] as const).map((th) => (
                    <button key={th} type="button" onClick={() => update({ theme: th })}
                      className={['flex-1 rounded-xl py-2 text-xs font-bold capitalize transition', config.theme === th ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-black/8'].join(' ')}
                    >{th}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl bg-black/4 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">{t('glassIntensity')}</p>
                <input type="range" min="30" max="95" value={config.glass} onChange={(e) => update({ glass: Number(e.target.value) })} className="w-full accent-slate-700" />
                <p className="text-right text-xs font-bold text-slate-400">{config.glass}%</p>
              </div>
            </>
          )}

          {section === 'layout' && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('layout')}</h3>
              <div className="flex flex-col gap-3 rounded-2xl bg-black/4 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('showDock')}</p>
                  <Toggle checked={config.showDock} onChange={(v) => update({ showDock: v })} testId="toggle-show-dock" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('showWidgets')}</p>
                  <Toggle checked={config.showWidgets} onChange={(v) => update({ showWidgets: v })} testId="toggle-show-widgets" />
                </div>
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-sm font-bold text-slate-700">{t('columns')}</p>
                  <input type="number" min="4" max="10" value={config.gridColumns} onChange={(e) => update({ gridColumns: Number(e.target.value) })} className="w-16 rounded-xl bg-white px-2 py-1 text-sm font-bold text-slate-800 outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-sm font-bold text-slate-700">{t('rows')}</p>
                  <input type="number" min="3" max="7" value={config.gridRows} onChange={(e) => update({ gridRows: Number(e.target.value) })} className="w-16 rounded-xl bg-white px-2 py-1 text-sm font-bold text-slate-800 outline-none" />
                </div>
              </div>
            </>
          )}

          {section === 'engines' && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('searchEngines')}</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-2xl bg-black/4 p-4">
                  <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="flex-1 text-sm font-bold text-slate-700">{t('defaultEngine')}</p>
                  <select
                    value={config.defaultEngine ?? ''}
                    onChange={(e) => onConfigChange({ ...config, defaultEngine: e.target.value })}
                    className="rounded-xl bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                  >
                    {config.searchEngines.filter((e) => e.enabled).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                {config.searchEngines.map((engine) => (
                  <div key={engine.id} className="flex items-center gap-3 rounded-2xl bg-black/4 p-4">
                    <Toggle
                      checked={engine.enabled ?? false}
                      onChange={(v) => updateEngine(engine.id, { enabled: v })}
                      testId={`toggle-engine-${engine.id}`}
                    />
                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      <p className="text-sm font-black">{engine.name} {engine.shortcut ? <span className="text-slate-500">/{engine.shortcut}</span> : null}</p>
                      <p className="truncate text-xs font-semibold text-slate-500">{engine.template ?? engine.url}</p>
                    </div>
                    {!engine.builtIn && (
                      <button type="button" onClick={() => removeEngine(engine.id)} className="shrink-0 text-slate-400 transition hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}

                <div className="flex flex-col gap-2 rounded-2xl bg-black/4 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">{t('addEngine')}</p>
                  <input value={newEngine.name} onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })} placeholder="Name" className="rounded-xl bg-white px-3 py-2 text-sm font-bold outline-none" />
                  <input value={newEngine.shortcut} onChange={(e) => setNewEngine({ ...newEngine, shortcut: e.target.value })} placeholder="Shortcut (e.g. g)" className="rounded-xl bg-white px-3 py-2 text-sm font-bold outline-none" />
                  <input value={newEngine.template} onChange={(e) => setNewEngine({ ...newEngine, template: e.target.value })} placeholder="https://…?q={q}" className="rounded-xl bg-white px-3 py-2 text-sm font-bold outline-none" />
                  <button type="button" onClick={addEngine} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
                    <Plus className="h-4 w-4" /> {t('addEngine')}
                  </button>
                </div>
              </div>
            </>
          )}

          {section === 'widgets' && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('widgets')}</h3>
              <div className="flex flex-col gap-3 rounded-2xl bg-black/4 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('todoWidget')}</p>
                  <Toggle checked={config.widgets.todoMeta.enabled} onChange={(v) => onConfigChange({ ...config, widgets: { ...config.widgets, todoMeta: { ...config.widgets.todoMeta, enabled: v } } })} testId="toggle-todo" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('pomodoroWidget')}</p>
                  <Toggle checked={config.widgets.pomodoroMeta.enabled} onChange={(v) => onConfigChange({ ...config, widgets: { ...config.widgets, pomodoroMeta: { ...config.widgets.pomodoroMeta, enabled: v } } })} testId="toggle-pomodoro" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('notesWidget')}</p>
                  <Toggle checked={config.widgets.notesMeta.enabled} onChange={(v) => onConfigChange({ ...config, widgets: { ...config.widgets, notesMeta: { ...config.widgets.notesMeta, enabled: v } } })} testId="toggle-notes" />
                </div>
              </div>
            </>
          )}

          {section === 'experiments' && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('experiments')}</h3>
              <div className="flex flex-col gap-3 rounded-2xl bg-black/4 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('smartRecommendations')}</p>
                  <Toggle checked={config.experiments.smartRecommendations} onChange={(v) => update({ experiments: { ...config.experiments, smartRecommendations: v } })} testId="toggle-smart" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('recentVisits')}</p>
                  <Toggle checked={config.experiments.recentVisits} onChange={(v) => update({ experiments: { ...config.experiments, recentVisits: v } })} testId="toggle-recent" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">{t('keyboardShortcuts')}</p>
                  <Toggle checked={config.experiments.keyboardShortcuts} onChange={(v) => update({ experiments: { ...config.experiments, keyboardShortcuts: v } })} testId="toggle-kb" />
                </div>
              </div>
            </>
          )}

          {section === 'data' && (
            <>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{t('data')}</h3>
              <div className="flex flex-col gap-3">
                <button type="button" onClick={onExportJson} className="flex items-center gap-3 rounded-2xl bg-black/4 p-4 text-sm font-bold text-slate-700 transition hover:bg-black/8">
                  <Download className="h-4 w-4" /> {t('exportJson')}
                </button>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-black/4 p-4 text-sm font-bold text-slate-700 transition hover:bg-black/8">
                  <Upload className="h-4 w-4" /> {t('importJson')}
                  <input type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImportJson(e.target.files[0]); }} />
                </label>
                <button type="button" onClick={onResetDefaults} className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-500 transition hover:bg-red-100">
                  <RotateCcw className="h-4 w-4" /> {t('resetDefaults')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
