import { Search, Settings, Sun } from 'lucide-react';
import type { Space, WidgetState } from '../types';
import type { TranslationKey } from '../i18n';
import { WidgetMiniIcons } from './Widgets';

type TopBarProps = {
  spaces: Space[];
  currentSpaceId: string;
  editing: boolean;
  syncStatus: string;
  glass: number;
  t: (key: TranslationKey) => string;
  widgets: WidgetState;
  onSpaceChange: (spaceId: string) => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onToggleEditing: () => void;
  onToggleTheme: () => void;
  onWidgetsChange: (w: WidgetState) => void;
};

function glassStyle(glass: number) {
  const alpha = Math.min(0.38, Math.max(0.08, glass / 300));
  const blur  = Math.round(4 + glass / 10);
  return {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  } as React.CSSProperties;
}

export function TopBar({
  spaces,
  currentSpaceId,
  editing,
  glass,
  t,
  widgets,
  onSpaceChange,
  onSearchClick,
  onSettingsClick,
  onToggleEditing,
  onToggleTheme,
  onWidgetsChange,
}: TopBarProps) {
  const currentIdx = spaces.findIndex((s) => s.id === currentSpaceId);

  const switchNext = () => {
    if (spaces.length < 2) return;
    onSpaceChange(spaces[(currentIdx + 1) % spaces.length].id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        {/* Space switcher + hint button */}
        <div className="flex items-center gap-2">
          <nav aria-label="Spaces" className="flex gap-1">
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => onSpaceChange(space.id)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-bold transition',
                  currentSpaceId === space.id
                    ? 'bg-white/28 text-white shadow'
                    : 'text-white/60 hover:bg-white/12 hover:text-white',
                ].join(' ')}
                aria-current={currentSpaceId === space.id ? 'page' : undefined}
              >
                {space.name}
              </button>
            ))}
          </nav>

          {/* Cycle button with keyboard hint tooltip */}
          {spaces.length > 1 && (
            <div className="group relative">
              <button
                type="button"
                onClick={switchNext}
                aria-label="Switch to next space"
                className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] font-black text-white/50 transition hover:bg-white/20 hover:text-white/80"
              >
                <span>⇥</span>
              </button>
              {/* Tooltip */}
              <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-2 text-[0.65rem] font-semibold text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 z-50">
                <p className="mb-1 font-black tracking-wide text-white/60 uppercase text-[0.55rem]">Switch Space</p>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Next space</span>
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-white">Ctrl →</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Prev space</span>
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-white">Ctrl ←</kbd>
                  </div>
                </div>
                {/* arrow */}
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900/90" />
              </div>
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <WidgetMiniIcons widgets={widgets} onChange={onWidgetsChange} />
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={onToggleTheme}
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/18 hover:text-white"
          >
            <Sun className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={editing ? t('done') : t('edit')}
            onClick={onToggleEditing}
            className={[
              'rounded-full px-3 py-1 text-xs font-bold transition',
              editing ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/18 hover:text-white',
            ].join(' ')}
          >
            {editing ? t('done') : t('edit')}
          </button>
          <button
            type="button"
            aria-label={t('settings')}
            onClick={onSettingsClick}
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/18 hover:text-white"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex justify-center px-4 pb-3">
        <button
          type="button"
          aria-label={t('searchPlaceholderBar')}
          onClick={onSearchClick}
          className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/25 px-4 py-2.5 text-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.18)] transition hover:text-white/80"
          style={glassStyle(glass)}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">{t('searchPlaceholderBar')}</span>
        </button>
      </div>
    </header>
  );
}
