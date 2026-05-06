import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AppShortcut, SearchEngine, SearchEngineId } from '../types';

type SpotlightSearchProps = {
  open: boolean;
  apps: AppShortcut[];
  engines: SearchEngine[];
  defaultEngine: SearchEngineId;
  t: (key: string) => string;
  onClose: () => void;
  onEngineChange: (engineId: string) => void;
};

function buildSearchUrl(engine: SearchEngine, query: string): string {
  return (engine.template ?? engine.url ?? 'https://www.google.com/search?q={q}').replaceAll('{q}', encodeURIComponent(query));
}

export function SpotlightSearch({ open, apps, engines, defaultEngine, t, onClose, onEngineChange }: SpotlightSearchProps) {
  const enabledEngines = engines.filter((e) => e.enabled);
  const [query, setQuery] = useState('');
  const [activeEngine, setActiveEngine] = useState<SearchEngine | null>(
    enabledEngines.find((e) => e.id === defaultEngine) ?? enabledEngines[0] ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(''); inputRef.current?.focus(); }
  }, [open]);

  useEffect(() => {
    setActiveEngine(enabledEngines.find((e) => e.id === defaultEngine) ?? enabledEngines[0] ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEngine]);

  if (!open) return null;

  const normalized = query.trim().toLowerCase();
  const engineMatch = enabledEngines.find((item) => item.shortcut && normalized.startsWith(`${item.shortcut} `));
  const cleanQuery  = engineMatch ? query.trim().slice((engineMatch.shortcut?.length ?? 0) + 1).trim() : query.trim();
  const searchWith  = engineMatch ?? activeEngine;

  const appResults = apps.filter((app) =>
    app.name.toLowerCase().includes(normalized) ||
    app.url.toLowerCase().includes(normalized),
  ).slice(0, 5);

  const handleSearch = () => {
    if (!cleanQuery || !searchWith) return;
    window.open(buildSearchUrl(searchWith, cleanQuery), '_self');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(12px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
              if (e.key === 'Escape') onClose();
            }}
            placeholder={t('searchPlaceholderBar')}
            className="flex-1 bg-transparent text-base font-bold text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-black/8 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Engine tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-black/6 px-5 py-2.5 scrollbar-hide">
          {enabledEngines.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveEngine(item); onEngineChange(item.id); }}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition',
                activeEngine?.id === item.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-black/8',
              ].join(' ')}
            >
              {item.name}
              {item.shortcut && (
                <span className={['rounded-md px-1.5 py-0.5 text-[0.65rem] uppercase', activeEngine?.id === item.id ? 'bg-white/20 text-white/80' : 'bg-slate-200 text-slate-500'].join(' ')}>{item.shortcut}</span>
              )}
            </button>
          ))}
        </div>

        {/* App results */}
        {appResults.length > 0 && (
          <div className="border-t border-black/6 px-3 py-2">
            {appResults.map((app) => (
              <a
                key={app.id}
                href={app.url}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-black/6"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${app.url}&sz=32`}
                  alt=""
                  className="h-6 w-6 rounded-md object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">{app.name}</p>
                  <p className="text-xs text-slate-400">{app.url}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Search CTA */}
        {cleanQuery && (
          <div className="border-t border-black/6 px-3 py-2">
            <button
              type="button"
              onClick={handleSearch}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-black/6"
            >
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <p className="text-sm font-bold text-slate-600">
                {t('search')} &ldquo;{cleanQuery}&rdquo; {searchWith ? `· ${searchWith.name}` : ''}
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
