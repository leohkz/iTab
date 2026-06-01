import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, Clock, FileText, CheckSquare, Zap, Globe, BookOpen } from 'lucide-react';
import type { AppShortcut, SearchEngine, TodoItem, NoteTab, Prompt } from '../types';
import type { TranslationKey } from '../i18n';

type Props = {
  open: boolean;
  apps: AppShortcut[];
  engines: SearchEngine[];
  defaultEngine: string;
  todos: TodoItem[];
  noteTabs: NoteTab[];
  prompts: Prompt[];
  t: (key: TranslationKey) => string;
  dark?: boolean;
  onClose: () => void;
  onEngineChange: (engineId: string) => void;
};

type ResultItem =
  | { kind: 'app';    app: AppShortcut }
  | { kind: 'engine'; engine: SearchEngine }
  | { kind: 'todo';   todo: TodoItem }
  | { kind: 'note';   tab: NoteTab; snippet: string }
  | { kind: 'prompt'; prompt: Prompt };

function getFaviconUrl(url: string): string {
  try {
    const encoded = encodeURIComponent(url);
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encoded}&size=64`;
  } catch {
    return '';
  }
}

function AppFavicon({ app, dark }: { app: AppShortcut; dark: boolean }) {
  const [err, setErr] = useState(false);
  const src = getFaviconUrl(app.url);
  const fallbackBg = app.iconColor ?? '#6366f1';

  const containerCls = dark
    ? 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#3a3a3c]'
    : 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-100';

  if (!err && src) {
    return (
      <div className={containerCls}>
        <img src={src} alt={app.name} className="w-5 h-5 object-contain" onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-black"
      style={{ backgroundColor: fallbackBg }}
    >
      {app.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function SpotlightSearch({
  open, apps, engines, defaultEngine, todos, noteTabs, prompts, t, dark = false, onClose, onEngineChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  const activeEngines = useMemo(() => engines.filter((e) => e.enabled), [engines]);
  const currentEngine = useMemo(
    () => activeEngines.find((e) => e.id === defaultEngine) ?? activeEngines[0],
    [activeEngines, defaultEngine],
  );

  useEffect(() => {
    if (open) { setQuery(''); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const results = useMemo((): ResultItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: ResultItem[] = [];

    apps.filter((a) => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q))
      .slice(0, 5).forEach((app) => out.push({ kind: 'app', app }));

    engines.filter((e) => e.enabled && (e.name.toLowerCase().includes(q) || (e.shortcut && e.shortcut.includes(q))))
      .slice(0, 3).forEach((engine) => out.push({ kind: 'engine', engine }));

    todos.filter((td) => !td.done && td.text.toLowerCase().includes(q))
      .slice(0, 3).forEach((todo) => out.push({ kind: 'todo', todo }));

    (noteTabs ?? []).forEach((tab) => {
      const idx = tab.content.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const snippet = (start > 0 ? '…' : '') + tab.content.slice(start, idx + q.length + 40);
        out.push({ kind: 'note', tab, snippet });
      }
    });

    (prompts ?? []).filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags ?? []).some((tg) => tg.label.toLowerCase().includes(q)),
    ).slice(0, 3).forEach((prompt) => out.push({ kind: 'prompt', prompt }));

    return out;
  }, [query, apps, engines, todos, noteTabs, prompts]);

  useEffect(() => { setActiveIdx(0); }, [results.length]);

  const execSearch = (engine: SearchEngine, q: string) => {
    const tmpl = engine.template ?? engine.url ?? `https://www.google.com/search?q={query}`;
    window.open(tmpl.replace('{query}', encodeURIComponent(q)), '_blank');
    onClose();
  };

  const activateResult = (item: ResultItem) => {
    if (item.kind === 'app')    { window.open(item.app.url, '_blank'); onClose(); }
    if (item.kind === 'engine') { if (query.trim()) execSearch(item.engine, query.trim()); }
    if (item.kind === 'todo')   { onClose(); }
    if (item.kind === 'note')   { onClose(); }
    if (item.kind === 'prompt') {
      navigator.clipboard?.writeText(item.prompt.content).catch(() => {});
      onClose();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')     { onClose(); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, (results.length || 1) - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) { activateResult(results[activeIdx]); }
      else if (query.trim() && currentEngine) { execSearch(currentEngine, query.trim()); onClose(); }
    }
  };

  if (!open) return null;

  // ── dark / light tokens ──
  const overlay   = dark ? 'bg-black/60' : 'bg-black/30';
  const container = dark ? 'bg-[#1c1c1e] border border-white/10' : 'bg-white border border-black/8';
  const inputCls  = dark ? 'text-white placeholder:text-white/30' : 'text-slate-900 placeholder:text-slate-400';
  const engineBar = dark ? 'bg-[#2c2c2e] border-t border-white/8' : 'bg-slate-50 border-t border-slate-200';
  const engineBtn = (active: boolean) => dark
    ? (active ? 'bg-blue-600 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white')
    : (active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800');
  const resultHover = dark ? 'hover:bg-white/8' : 'hover:bg-slate-100';
  const resultActive = dark ? 'bg-white/15' : 'bg-slate-200';
  const sectionLabel = dark ? 'text-white/30' : 'text-slate-400';
  const primaryText  = dark ? 'text-white' : 'text-slate-900';
  const secondaryText = dark ? 'text-white/50' : 'text-slate-500';
  const divider      = dark ? 'border-white/8' : 'border-slate-100';
  const searchIcon   = dark ? 'text-white/30' : 'text-slate-400';
  const noResultText = dark ? 'text-white/40' : 'text-slate-400';
  const snippetText  = dark ? 'text-white/40' : 'text-slate-400';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] ${overlay}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${container}`}
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {/* Search input row */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${divider}`}>
          <Search className={`w-5 h-5 flex-shrink-0 ${searchIcon}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('search')}
            className={`flex-1 bg-transparent outline-none text-base font-medium ${inputCls}`}
          />
        </div>

        {/* Engine selector */}
        <div className={`flex items-center gap-1 px-3 py-2 ${engineBar}`}>
          {activeEngines.map((eng) => (
            <button
              key={eng.id}
              type="button"
              onClick={() => onEngineChange(eng.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                engineBtn(eng.id === defaultEngine)
              }`}
            >
              {eng.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {query.trim() && (
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className={`px-4 py-8 text-center text-sm ${noResultText}`}>
                {t('noResults')} — press Enter to search
              </div>
            ) : (
              <>
                {/* Apps */}
                {results.some((r) => r.kind === 'app') && (
                  <>
                    <div className={`px-4 py-1 text-xs font-black uppercase tracking-widest ${sectionLabel}`}>
                      {t('apps')}
                    </div>
                    {results.filter((r): r is Extract<ResultItem, { kind: 'app' }> => r.kind === 'app').map((item, i) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.app.id}
                          type="button"
                          onClick={() => activateResult(item)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                            globalIdx === activeIdx ? resultActive : resultHover
                          }`}
                        >
                          <AppFavicon app={item.app} dark={dark} />
                          <div className="min-w-0">
                            <div className={`text-sm font-bold truncate ${primaryText}`}>{item.app.name}</div>
                            <div className={`text-xs truncate ${secondaryText}`}>{item.app.url}</div>
                          </div>
                          <Globe className={`w-4 h-4 flex-shrink-0 ml-auto ${secondaryText}`} />
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Search engines */}
                {results.some((r) => r.kind === 'engine') && (
                  <>
                    <div className={`px-4 py-1 text-xs font-black uppercase tracking-widest mt-1 ${sectionLabel}`}>
                      {t('searchEngines')}
                    </div>
                    {results.filter((r): r is Extract<ResultItem, { kind: 'engine' }> => r.kind === 'engine').map((item) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.engine.id}
                          type="button"
                          onClick={() => activateResult(item)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                            globalIdx === activeIdx ? resultActive : resultHover
                          }`}
                        >
                          <div className={dark ? 'w-8 h-8 rounded-xl bg-[#3a3a3c] flex items-center justify-center' : 'w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center'}>
                            <Zap className={`w-4 h-4 ${secondaryText}`} />
                          </div>
                          <div className={`text-sm font-bold ${primaryText}`}>{item.engine.name}</div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Todos */}
                {results.some((r) => r.kind === 'todo') && (
                  <>
                    <div className={`px-4 py-1 text-xs font-black uppercase tracking-widest mt-1 ${sectionLabel}`}>
                      {t('todos')}
                    </div>
                    {results.filter((r): r is Extract<ResultItem, { kind: 'todo' }> => r.kind === 'todo').map((item) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.todo.id}
                          type="button"
                          onClick={() => activateResult(item)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                            globalIdx === activeIdx ? resultActive : resultHover
                          }`}
                        >
                          <div className={dark ? 'w-8 h-8 rounded-xl bg-[#3a3a3c] flex items-center justify-center' : 'w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center'}>
                            <CheckSquare className={`w-4 h-4 ${secondaryText}`} />
                          </div>
                          <div className={`text-sm font-medium ${primaryText}`}>{item.todo.text}</div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Notes */}
                {results.some((r) => r.kind === 'note') && (
                  <>
                    <div className={`px-4 py-1 text-xs font-black uppercase tracking-widest mt-1 ${sectionLabel}`}>
                      {t('notes')}
                    </div>
                    {results.filter((r): r is Extract<ResultItem, { kind: 'note' }> => r.kind === 'note').map((item) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.tab.id}
                          type="button"
                          onClick={() => activateResult(item)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition ${
                            globalIdx === activeIdx ? resultActive : resultHover
                          }`}
                        >
                          <div className={dark ? 'w-8 h-8 rounded-xl bg-[#3a3a3c] flex items-center justify-center flex-shrink-0' : 'w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0'}>
                            <FileText className={`w-4 h-4 ${secondaryText}`} />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-bold ${primaryText}`}>{item.tab.name}</div>
                            <div className={`text-xs truncate ${snippetText}`}>{item.snippet}</div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Prompts */}
                {results.some((r) => r.kind === 'prompt') && (
                  <>
                    <div className={`px-4 py-1 text-xs font-black uppercase tracking-widest mt-1 ${sectionLabel}`}>
                      {t('promptLibrary')}
                    </div>
                    {results.filter((r): r is Extract<ResultItem, { kind: 'prompt' }> => r.kind === 'prompt').map((item) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.prompt.id}
                          type="button"
                          onClick={() => activateResult(item)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                            globalIdx === activeIdx ? resultActive : resultHover
                          }`}
                        >
                          <div className={dark ? 'w-8 h-8 rounded-xl bg-[#3a3a3c] flex items-center justify-center' : 'w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center'}>
                            <BookOpen className={`w-4 h-4 ${secondaryText}`} />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-bold ${primaryText}`}>{item.prompt.title}</div>
                            <div className={`text-xs truncate ${snippetText}`}>{item.prompt.content.slice(0, 60)}</div>
                          </div>
                          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ml-auto ${secondaryText}`} />
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
