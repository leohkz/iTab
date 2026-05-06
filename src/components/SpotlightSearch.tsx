import { ArrowRight, Globe2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppShortcut, SearchEngine, SearchEngineId } from '../types';
import type { TranslationKey } from '../i18n';

type SpotlightSearchProps = {
  open: boolean;
  apps: AppShortcut[];
  engines: SearchEngine[];
  defaultEngine: SearchEngineId;
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onEngineChange: (engine: SearchEngineId) => void;
};

function buildSearchUrl(engine: SearchEngine, query: string) {
  // template is optional in type; fall back to a plain URL search if missing
  return (engine.template ?? '{q}').replaceAll('{q}', encodeURIComponent(query));
}

export function SpotlightSearch({ open, apps, engines, defaultEngine, t, onClose, onEngineChange }: SpotlightSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [engineId, setEngineId] = useState<SearchEngineId>(defaultEngine);
  const enabledEngines = engines.filter((e) => e.enabled);

  useEffect(() => {
    if (open) {
      setQuery('');
      setEngineId(defaultEngine);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [defaultEngine, open]);

  const normalized = query.trim().toLowerCase();
  // shortcut is optional — only match if the engine actually has one
  const engineMatch = enabledEngines.find((item) => item.shortcut && normalized.startsWith(`${item.shortcut} `));
  const activeEngine = engineMatch ?? enabledEngines.find((e) => e.id === engineId) ?? enabledEngines[0];
  const cleanQuery = engineMatch ? query.trim().slice((engineMatch.shortcut ?? '').length + 1).trim() : query.trim();

  const appResults = useMemo(() => {
    if (!normalized) return apps.slice(0, 6);
    return apps.filter((a) => a.name.toLowerCase().includes(normalized) || a.url.toLowerCase().includes(normalized)).slice(0, 6);
  }, [apps, normalized]);

  if (!open) return null;

  const submitSearch = () => {
    if (!cleanQuery || !activeEngine) return;
    window.open(buildSearchUrl(activeEngine, cleanQuery), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/60 px-4 pt-[12vh] backdrop-blur-md"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        role="dialog" aria-modal="true" aria-label="Spotlight search"
        className="w-[min(44rem,calc(100vw-2rem))] overflow-hidden rounded-[1.7rem] border border-white/20 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.6)]"
        data-testid="modal-spotlight"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef} value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter') submitSearch(); }}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 bg-white text-lg font-bold tracking-[-0.04em] text-slate-950 placeholder:text-slate-400 focus:outline-none"
            data-testid="input-spotlight"
          />
          <button type="button" onClick={onClose} aria-label={t('cancel')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition duration-200 hover:bg-slate-200"
            data-testid="button-close-spotlight">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 bg-white p-4">
          {/* Search engines — flex-wrap prevents overflow */}
          <div>
            <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('searchEngines')}</p>
            <div className="flex flex-wrap gap-2">
              {enabledEngines.map((item) => (
                <button
                  key={item.id} type="button"
                  onClick={() => { setEngineId(item.id); onEngineChange(item.id); }}
                  className={[
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition duration-200',
                    activeEngine?.id === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  ].join(' ')}
                  data-testid={`button-engine-${item.id}`}
                >
                  {item.name}
                  {item.shortcut && (
                    <span className={['rounded-md px-1.5 py-0.5 text-[0.65rem] uppercase', activeEngine?.id === item.id ? 'bg-white/20 text-white/80' : 'bg-slate-200 text-slate-500'].join(' ')}>{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('appsAndShortcuts')}</p>
            <div className="grid gap-1">
              {appResults.map((app) => (
                <a key={app.id} href={app.url} target="_blank" rel="noreferrer" onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-slate-800 transition duration-200 hover:bg-slate-100"
                  data-testid={`spotlight-result-${app.id}`}>
                  <span>
                    <span className="block text-sm font-black text-slate-900">{app.name}</span>
                    <span className="block text-xs font-semibold text-slate-400">{app.url}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </a>
              ))}
              {cleanQuery && activeEngine ? (
                <button type="button" onClick={submitSearch}
                  className="mt-1 flex items-center justify-between rounded-xl bg-slate-900 px-3 py-3 text-left text-white transition duration-200 hover:bg-slate-800"
                  data-testid="button-submit-search">
                  <span className="flex items-center gap-3">
                    <Globe2 className="h-5 w-5" />
                    <span>
                      <span className="block text-sm font-black">{t('searchWith').replace('{engine}', activeEngine.name)}</span>
                      <span className="block text-xs font-semibold text-white/60">{cleanQuery}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
