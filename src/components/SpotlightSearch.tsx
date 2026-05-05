import { ArrowRight, Globe2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppShortcut, SearchEngine, SearchEngineId } from '../types';

type SpotlightSearchProps = {
  open: boolean;
  apps: AppShortcut[];
  engines: SearchEngine[];
  defaultEngine: SearchEngineId;
  onClose: () => void;
  onEngineChange: (engine: SearchEngineId) => void;
};

function buildSearchUrl(engine: SearchEngine, query: string) {
  return engine.template.replaceAll('{q}', encodeURIComponent(query));
}

export function SpotlightSearch({ open, apps, engines, defaultEngine, onClose, onEngineChange }: SpotlightSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [engineId, setEngineId] = useState<SearchEngineId>(defaultEngine);
  const enabledEngines = engines.filter((engine) => engine.enabled);

  useEffect(() => {
    if (open) {
      setEngineId(defaultEngine);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [defaultEngine, open]);

  const normalized = query.trim().toLowerCase();
  const engineMatch = enabledEngines.find((item) => normalized.startsWith(`${item.shortcut} `));
  const activeEngine = engineMatch ?? enabledEngines.find((engine) => engine.id === engineId) ?? enabledEngines[0];
  const cleanQuery = engineMatch ? query.trim().slice(engineMatch.shortcut.length + 1).trim() : query.trim();

  const appResults = useMemo(() => {
    if (!normalized) return apps.slice(0, 6);
    return apps
      .filter((app) => app.name.toLowerCase().includes(normalized) || app.url.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [apps, normalized]);

  if (!open) return null;

  const submitSearch = () => {
    if (!cleanQuery || !activeEngine) return;
    window.open(buildSearchUrl(activeEngine, cleanQuery), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/28 px-4 pt-[12vh] backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
        className="w-[min(44rem,calc(100vw-2rem))] overflow-hidden rounded-[1.7rem] border border-white/35 bg-white/88 text-slate-950 shadow-[0_32px_90px_rgba(15,23,42,0.36),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl"
        data-testid="modal-spotlight"
      >
        <div className="flex items-center gap-3 border-b border-slate-950/10 px-5 py-4">
          <Search className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'Enter') submitSearch();
            }}
            placeholder="Search apps, bookmarks, or type shortcut + query"
            className="min-w-0 flex-1 bg-transparent text-lg font-bold tracking-[-0.04em] placeholder:text-slate-400 focus:outline-none"
            data-testid="input-spotlight"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-950/8 text-slate-600 transition duration-200 hover:bg-slate-950/14"
            data-testid="button-close-spotlight"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-4">
          <div>
            <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Enabled search engines</p>
            <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
              {enabledEngines.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEngineId(item.id);
                    onEngineChange(item.id);
                  }}
                  className={[
                    'flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-black transition duration-200',
                    activeEngine?.id === item.id ? 'bg-slate-950 text-white' : 'bg-slate-950/7 text-slate-700 hover:bg-slate-950/12',
                  ].join(' ')}
                  data-testid={`button-engine-${item.id}`}
                >
                  {item.name}
                  <span className="rounded-md bg-white/18 px-1.5 py-0.5 text-[0.65rem] uppercase">{item.shortcut}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Apps and shortcuts</p>
            <div className="grid gap-1">
              {appResults.map((app) => (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition duration-200 hover:bg-slate-950/8"
                  data-testid={`spotlight-result-${app.id}`}
                >
                  <span>
                    <span className="block text-sm font-black">{app.name}</span>
                    <span className="block text-xs font-semibold text-slate-500">{app.url}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </a>
              ))}

              {cleanQuery && activeEngine ? (
                <button
                  type="button"
                  onClick={submitSearch}
                  className="mt-1 flex items-center justify-between rounded-xl bg-slate-950 px-3 py-3 text-left text-white transition duration-200 hover:bg-slate-800"
                  data-testid="button-submit-search"
                >
                  <span className="flex items-center gap-3">
                    <Globe2 className="h-5 w-5" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-black">Search {activeEngine.name}</span>
                      <span className="block text-xs font-semibold text-white/62">{cleanQuery}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
