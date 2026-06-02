import { ArrowRight, Clock, FileText, Globe2, Hash, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { AppShortcut, SearchEngine, SearchEngineId, TodoItem, NoteTab, Prompt } from '../types';
import type { TranslationKey } from '../i18n';
import { FaviconImg } from './FaviconImg';

const RECENT_KEY = 'itab-spotlight-recent';
const MAX_RECENT = 8;

type ResultItem =
  | { kind: 'app';    app: AppShortcut }
  | { kind: 'todo';   item: TodoItem }
  | { kind: 'note';   tab: NoteTab; snippet: string }
  | { kind: 'prompt'; prompt: Prompt };

type SpotlightSearchProps = {
  open: boolean;
  apps: AppShortcut[];
  engines: SearchEngine[];
  defaultEngine: SearchEngineId;
  todos?: TodoItem[];
  noteTabs?: NoteTab[];
  prompts?: Prompt[];
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onEngineChange: (engine: SearchEngineId) => void;
};

function buildSearchUrl(engine: SearchEngine, query: string) {
  return (engine.template ?? '{q}').replaceAll('{q}', encodeURIComponent(query));
}

function getEngineSiteUrl(engine: SearchEngine): string {
  if (engine.url) return engine.url;
  if (engine.template) {
    try { return new URL(engine.template.replace('{q}', '')).origin; } catch { /* ignore */ }
  }
  return '';
}

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}

function saveRecent(q: string) {
  if (!q.trim()) return;
  const list = [q, ...loadRecent().filter(r => r !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function SpotlightSearch({
  open, apps, engines, defaultEngine,
  todos = [], noteTabs = [], prompts = [],
  t, onClose, onEngineChange,
}: SpotlightSearchProps) {
  const inputRef   = useRef<HTMLInputElement | null>(null);
  const listRef    = useRef<HTMLDivElement | null>(null);
  const [query, setQuery]       = useState('');
  const [engineId, setEngineId] = useState<SearchEngineId>(defaultEngine);
  const [cursor, setCursor]     = useState(-1);
  const [recent, setRecent]     = useState<string[]>([]);

  const enabledEngines = useMemo(() => engines.filter(e => e.enabled), [engines]);

  const activeEngineIdx = useMemo(
    () => Math.max(0, enabledEngines.findIndex(e => e.id === engineId)),
    [enabledEngines, engineId],
  );
  const activeEngine = enabledEngines[activeEngineIdx] ?? enabledEngines[0];

  const switchEngine = useCallback((id: SearchEngineId) => {
    setEngineId(id);
    onEngineChange(id);
    inputRef.current?.focus();
  }, [onEngineChange]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(-1);
      setEngineId(defaultEngine);
      setRecent(loadRecent());
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [defaultEngine, open]);

  const normalized  = query.trim().toLowerCase();
  const engineMatch = enabledEngines.find(e => e.shortcut && normalized.startsWith(`${e.shortcut} `));
  const cleanQuery  = engineMatch ? query.trim().slice((engineMatch.shortcut ?? '').length + 1).trim() : query.trim();
  const displayEngine = engineMatch ?? activeEngine;

  const results = useMemo((): ResultItem[] => {
    if (!normalized) return [];
    const q = normalized;
    const out: ResultItem[] = [];

    apps
      .filter(a => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(app => out.push({ kind: 'app', app }));

    todos
      .filter(td => !td.done && td.text.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(item => out.push({ kind: 'todo', item }));

    noteTabs.forEach(tab => {
      const pos = tab.content.toLowerCase().indexOf(q);
      if (pos === -1) return;
      const start   = Math.max(0, pos - 30);
      const snippet = (start > 0 ? '\u2026' : '') + tab.content.slice(start, pos + q.length + 40).trim() + '\u2026';
      out.push({ kind: 'note', tab, snippet });
    });

    prompts
      .filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(prompt => out.push({ kind: 'prompt', prompt }));

    return out;
  }, [normalized, apps, todos, noteTabs, prompts]);

  const hasSearch  = Boolean(cleanQuery && displayEngine);
  const totalItems = results.length + (hasSearch ? 1 : 0);

  const submitSearch = useCallback(() => {
    if (!cleanQuery || !displayEngine) return;
    saveRecent(cleanQuery);
    setRecent(loadRecent());
    window.location.href = buildSearchUrl(displayEngine, cleanQuery);
    onClose();
  }, [cleanQuery, displayEngine, onClose]);

  const activateItem = useCallback((idx: number) => {
    if (idx < results.length) {
      const r = results[idx];
      if (r.kind === 'app') { window.location.href = r.app.url; onClose(); }
      if (r.kind === 'todo')   { navigator.clipboard.writeText(r.item.text).catch(() => {}); onClose(); }
      if (r.kind === 'note')   { navigator.clipboard.writeText(r.tab.content).catch(() => {}); onClose(); }
      if (r.kind === 'prompt') { navigator.clipboard.writeText(r.prompt.content).catch(() => {}); onClose(); }
    } else if (idx === results.length && hasSearch) {
      submitSearch();
    }
  }, [results, hasSearch, submitSearch, onClose]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, totalItems - 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, -1)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cursor >= 0 && cursor < totalItems) activateItem(cursor);
      else submitSearch();
    }
  }, [onClose, totalItems, cursor, activateItem, submitSearch]);

  useEffect(() => {
    if (cursor < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const showRecent = !normalized && recent.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      role="presentation"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        role="dialog" aria-modal="true" aria-label="Spotlight search"
        className="w-[min(44rem,calc(100vw-2rem))] max-h-[80vh] overflow-hidden rounded-[1.7rem] flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(48px) saturate(2)',
          WebkitBackdropFilter: 'blur(48px) saturate(2)',
          boxShadow: '0 32px 90px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        {/* ── Input row ── */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef} value={query}
            onChange={e => { setQuery(e.target.value); setCursor(-1); }}
            onKeyDown={onKeyDown}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-lg font-bold tracking-[-0.04em] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {displayEngine && (
            <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              {displayEngine.name}
            </span>
          )}
          <button type="button" onClick={onClose} aria-label={t('cancel')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition duration-200 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Engine icon strip ── */}
        <div className="shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(248,248,250,0.7)', overflowX: 'auto', overflowY: 'visible' }}>
          <div className="flex items-center gap-1.5 px-5 pt-2.5 pb-8 min-w-max">
            {enabledEngines.map((eng) => {
              const isActive = eng.id === displayEngine?.id;
              const siteUrl  = getEngineSiteUrl(eng);
              return (
                <button
                  key={eng.id} type="button"
                  title={eng.name}
                  onClick={() => switchEngine(eng.id)}
                  className={[
                    'group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition duration-150',
                    isActive
                      ? 'bg-white ring-2 ring-slate-300 ring-offset-1 ring-offset-[rgba(248,248,250,0.7)] shadow-sm'
                      : 'bg-black/5 hover:bg-white hover:shadow-sm',
                  ].join(' ')}
                >
                  <FaviconImg
                    siteUrl={siteUrl}
                    customIcon={eng.icon}
                    name={eng.name}
                    size={18}
                    className="rounded-[3px]"
                  />
                  <span className="pointer-events-none absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800/90 px-2 py-0.5 text-[0.65rem] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                    {eng.name}
                    {eng.shortcut && <span className="ml-1 opacity-60">/{eng.shortcut}</span>}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="overflow-y-auto p-4 flex flex-col gap-4">

          {showRecent && (
            <div>
              <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('recentSearches')}</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r, i) => (
                  <button key={i} type="button"
                    onClick={() => setQuery(r)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* App shortcuts */}
          {normalized && (() => {
            const appItems = results.filter(r => r.kind === 'app') as { kind: 'app'; app: AppShortcut }[];
            if (!appItems.length) return null;
            return (
              <div>
                <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('appsAndShortcuts')}</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
                  {appItems.map((r) => {
                    const globalIdx = results.indexOf(r);
                    const isActive  = cursor === globalIdx;
                    return (
                      <a key={r.app.id}
                        href={r.app.url}
                        data-idx={globalIdx}
                        onClick={() => { saveRecent(cleanQuery); setRecent(loadRecent()); onClose(); }}
                        onMouseEnter={() => setCursor(globalIdx)}
                        className={[
                          'flex flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center transition duration-150 cursor-pointer',
                          isActive ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700',
                        ].join(' ')}
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <FaviconImg
                            siteUrl={r.app.url}
                            customIcon={r.app.iconType === 'url' ? r.app.iconValue : undefined}
                            name={r.app.name}
                            size={28}
                            className="rounded-lg"
                          />
                        </div>
                        <span className={['text-[0.65rem] font-black leading-tight line-clamp-2 w-full', isActive ? 'text-slate-700' : 'text-slate-500'].join(' ')}>
                          {r.app.name}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Todos */}
          {normalized && (() => {
            const todoItems = results.filter(r => r.kind === 'todo') as { kind: 'todo'; item: TodoItem }[];
            if (!todoItems.length) return null;
            return (
              <div>
                <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('todo')}</p>
                <div className="grid gap-1">
                  {todoItems.map(r => {
                    const globalIdx = results.indexOf(r);
                    const isActive  = cursor === globalIdx;
                    return (
                      <div key={r.item.id} data-idx={globalIdx}
                        onMouseEnter={() => setCursor(globalIdx)}
                        onClick={() => activateItem(globalIdx)}
                        className={['flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition', isActive ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700'].join(' ')}>
                        <Hash className={['h-4 w-4 shrink-0', isActive ? 'text-slate-400' : 'text-slate-300'].join(' ')} />
                        <span className="text-sm font-semibold">{r.item.text}</span>
                        {isActive && <span className="ml-auto text-[0.6rem] text-slate-400">Copy</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Notes */}
          {normalized && (() => {
            const noteItems = results.filter(r => r.kind === 'note') as { kind: 'note'; tab: NoteTab; snippet: string }[];
            if (!noteItems.length) return null;
            return (
              <div>
                <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('quickNote')}</p>
                <div className="grid gap-1">
                  {noteItems.map(r => {
                    const globalIdx = results.indexOf(r);
                    const isActive  = cursor === globalIdx;
                    return (
                      <div key={r.tab.id} data-idx={globalIdx}
                        onMouseEnter={() => setCursor(globalIdx)}
                        onClick={() => activateItem(globalIdx)}
                        className={['flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition', isActive ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700'].join(' ')}>
                        <FileText className={['h-4 w-4 mt-0.5 shrink-0', isActive ? 'text-slate-400' : 'text-slate-300'].join(' ')} />
                        <span>
                          <span className={['block text-xs font-black', isActive ? 'text-slate-500' : 'text-slate-400'].join(' ')}>{r.tab.name}</span>
                          <span className="block text-sm font-semibold line-clamp-1">{r.snippet}</span>
                        </span>
                        {isActive && <span className="ml-auto text-[0.6rem] text-slate-400 shrink-0 mt-0.5">Copy</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Prompts */}
          {normalized && (() => {
            const promptItems = results.filter(r => r.kind === 'prompt') as { kind: 'prompt'; prompt: Prompt }[];
            if (!promptItems.length) return null;
            return (
              <div>
                <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('prompts')}</p>
                <div className="grid gap-1">
                  {promptItems.map(r => {
                    const globalIdx = results.indexOf(r);
                    const isActive  = cursor === globalIdx;
                    return (
                      <div key={r.prompt.id} data-idx={globalIdx}
                        onMouseEnter={() => setCursor(globalIdx)}
                        onClick={() => activateItem(globalIdx)}
                        className={['flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition', isActive ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-700'].join(' ')}>
                        <span className={['text-base shrink-0', isActive ? 'opacity-70' : 'opacity-40'].join(' ')}>\u2726</span>
                        <span>
                          <span className="block text-sm font-black">{r.prompt.title}</span>
                          <span className={['block text-xs line-clamp-1', isActive ? 'text-slate-500' : 'text-slate-400'].join(' ')}>{r.prompt.content.slice(0, 60)}\u2026</span>
                        </span>
                        {isActive && <span className="ml-auto text-[0.6rem] text-slate-400 shrink-0">Copy</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Web search action */}
          {hasSearch && (() => {
            const searchIdx = results.length;
            const isActive = cursor === searchIdx;
            return (
              <button type="button" data-idx={searchIdx}
                onMouseEnter={() => setCursor(searchIdx)}
                onClick={submitSearch}
                className={['flex items-center justify-between rounded-xl px-3 py-3 text-left transition duration-200', isActive ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'].join(' ')}>
                <span className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-slate-500" />
                  <span>
                    <span className="block text-sm font-black">{t('searchWith').replace('{engine}', displayEngine?.name ?? '')}</span>
                    <span className={['block text-xs font-semibold', isActive ? 'text-slate-500' : 'text-slate-400'].join(' ')}>{cleanQuery}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })()}

          {normalized && results.length === 0 && !hasSearch && (
            <p className="py-6 text-center text-sm font-semibold text-slate-400">{t('noResults')}</p>
          )}

          {!normalized && (
            <div>
              <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('appsAndShortcuts')}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
                {apps.slice(0, 12).map(app => (
                  <a key={app.id} href={app.url} onClick={onClose}
                    className="flex flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center hover:bg-slate-50 transition cursor-pointer">
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
                      <FaviconImg
                        siteUrl={app.url}
                        customIcon={app.iconType === 'url' ? app.iconValue : undefined}
                        name={app.name}
                        size={28}
                        className="rounded-lg"
                      />
                    </div>
                    <span className="text-[0.65rem] font-black leading-tight line-clamp-2 w-full text-slate-500">{app.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
