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
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        {/* Space switcher */}
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

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Widget mini icons — appear when any widget is minimised */}
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
