import { Bookmark, Moon, Search, Settings, Sparkles, Check } from 'lucide-react';
import { WorkspaceMark } from './WorkspaceMark';
import type { Space } from '../types';

type TopBarProps = {
  spaces: Space[];
  currentSpaceId: string;
  editing: boolean;
  syncStatus: string;
  glass: number;
  onSpaceChange: (spaceId: string) => void;
  onSearchClick: () => void;
  onSyncBookmarks: () => void;
  onSettingsClick: () => void;
  onToggleEditing: () => void;
  onToggleTheme: () => void;
};

export function TopBar({
  spaces,
  currentSpaceId,
  editing,
  syncStatus,
  glass,
  onSpaceChange,
  onSearchClick,
  onSyncBookmarks,
  onSettingsClick,
  onToggleTheme,
}: TopBarProps) {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now);

  const currentSpace = spaces.find((space) => space.id === currentSpaceId) ?? spaces[0];
  const surfaceAlpha = Math.min(0.42, Math.max(0.12, glass / 260));
  const blurPx = Math.round(8 + glass / 8);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  const shortcutBadge = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <header
      className={[
        'fixed left-4 right-4 top-4 z-40 grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-[1.4rem] border px-4 py-2 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] max-md:grid-cols-2 max-md:gap-2 transition duration-300',
        editing ? 'border-white/60 ring-2 ring-white/30' : 'border-white/25',
      ].join(' ')}
      style={{
        backgroundColor: `rgba(255,255,255,${surfaceAlpha})`,
        backdropFilter: `blur(${blurPx}px)`,
        WebkitBackdropFilter: `blur(${blurPx}px)`,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Cycle workspace"
          onClick={() => {
            const index = spaces.findIndex((space) => space.id === currentSpaceId);
            onSpaceChange(spaces[(index + 1) % spaces.length].id);
          }}
          className="rounded-xl transition duration-200 hover:scale-105 active:scale-95"
          data-testid="button-cycle-space"
        >
          <WorkspaceMark />
        </button>
        <div className="min-w-0">
          <label className="text-xs font-medium uppercase tracking-[0.26em] text-white/55" htmlFor="space-select">
            Space
          </label>
          <select
            id="space-select"
            value={currentSpace.id}
            onChange={(event) => onSpaceChange(event.target.value)}
            className="block max-w-40 truncate bg-transparent text-base font-bold leading-tight tracking-[-0.03em] text-white focus:outline-none"
            data-testid="select-space"
          >
            {spaces.map((space) => (
              <option key={space.id} value={space.id} className="text-slate-950">
                {space.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] max-md:hidden">
        <span className="text-sm font-bold tabular-nums" data-testid="text-clock">{time}</span>
        <span className="h-1 w-1 rounded-full bg-white/45" />
        <span className="text-sm font-medium text-white/76" data-testid="text-date">{date}</span>
        <span className="h-1 w-1 rounded-full bg-white/45" />
        <span className="flex items-center gap-1.5 text-sm font-medium text-white/76" data-testid="text-weather">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          24° Clear
        </span>
        <span className="h-1 w-1 rounded-full bg-white/45" />
        <span className="flex items-center gap-1.5 text-sm font-medium text-white/76" data-testid="text-sync-status">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {syncStatus}
        </span>
      </div>

      <nav className="flex min-w-0 items-center justify-end gap-2" aria-label="Workspace tools">
        {editing ? (
          <span className="rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur-sm">
            ✏️ Edit mode — click blank area to exit
          </span>
        ) : (
          <button
            type="button"
            onClick={onSearchClick}
            className="flex h-10 min-w-0 max-w-[18rem] flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/18 px-3 text-left text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] backdrop-blur-md transition duration-200 hover:bg-white/26 max-md:hidden"
            data-testid="button-open-search"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/62">Search apps &amp; web</span>
            <span className="shrink-0 rounded-md border border-white/20 px-1.5 py-0.5 text-[0.65rem] font-black text-white/70">{shortcutBadge}</span>
          </button>
        )}
        <button
          type="button"
          aria-label="Sync bookmarks"
          onClick={onSyncBookmarks}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-200 hover:bg-white/28 active:scale-95"
          data-testid="button-bookmark-sync"
        >
          <Bookmark className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Cycle wallpaper theme"
          onClick={onToggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-200 hover:bg-white/28 active:scale-95"
          data-testid="button-theme-toggle"
        >
          <Moon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Open settings"
          onClick={onSettingsClick}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-200 hover:bg-white/28 active:scale-95"
          data-testid="button-open-settings"
        >
          <Settings className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
