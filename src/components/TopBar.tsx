// TopBar – original design restored + droppable Space zones when editing
import { Search, Settings, Sun } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { Space, WidgetState } from '../types';
import type { TranslationKey } from '../i18n';
import { WidgetMiniIcons } from './Widgets';

export const SPACE_DROP_PREFIX = 'space-drop-';

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
  [key: string]: unknown;
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

function ITabIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none" className={className}>
      <defs>
        <linearGradient id="tb_bg" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2744"/>
          <stop offset="1" stopColor="#0a0f1e"/>
        </linearGradient>
        <linearGradient id="tb_bar" x1="36" y1="0" x2="92" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8"/>
          <stop offset="0.5" stopColor="#818cf8"/>
          <stop offset="1" stopColor="#38bdf8"/>
        </linearGradient>
        <filter id="tb_blur_i" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tb_blur_bar" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#tb_bg)"/>
      <rect width="128" height="64" rx="28" fill="white" fillOpacity="0.04"/>
      <ellipse cx="64" cy="62" rx="22" ry="28" fill="#6366f1" fillOpacity="0.18"/>
      <circle cx="64" cy="34" r="7" fill="white" filter="url(#tb_blur_i)"/>
      <circle cx="64" cy="34" r="5" fill="white"/>
      <rect x="58" y="47" width="12" height="38" rx="6" fill="white" filter="url(#tb_blur_i)"/>
      <rect x="59.5" y="47" width="9" height="38" rx="4.5" fill="white"/>
      <rect x="36" y="92" width="56" height="4" rx="2" fill="url(#tb_bar)" filter="url(#tb_blur_bar)" opacity="0.7"/>
      <rect x="36" y="93" width="56" height="3" rx="1.5" fill="url(#tb_bar)"/>
    </svg>
  );
}

/**
 * Each space tab doubles as a droppable zone when editing.
 * `disabled: !editing` keeps the droppable inactive during normal use
 * so it doesn't interfere with mouse events.
 */
function DroppableSpaceTab({
  space, isActive, editing, onSpaceChange,
}: {
  space: Space;
  isActive: boolean;
  editing: boolean;
  onSpaceChange: (id: string) => void;
}) {
  const dropId = `${SPACE_DROP_PREFIX}${space.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { container: dropId, spaceId: space.id },
    disabled: !editing,
  });

  return (
    <button
      ref={setNodeRef}
      key={space.id}
      type="button"
      onClick={() => onSpaceChange(space.id)}
      style={{
        /* prevent layout shift / size change on hover during drag */
        outline: isOver ? '2px solid rgba(255,255,255,0.55)' : '2px solid transparent',
        outlineOffset: '1px',
        transform: isOver ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 120ms, outline 120ms',
      }}
      className={[
        'rounded-full px-3 py-1 text-xs font-bold transition-colors',
        isActive
          ? 'bg-white/28 text-white shadow'
          : 'text-white/60 hover:bg-white/12 hover:text-white',
        isOver ? 'bg-white/22 text-white' : '',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      {space.name}
      {isOver && (
        <span className="ml-1.5 inline-block animate-pulse text-[0.55rem] font-black uppercase tracking-widest opacity-80">
          drop
        </span>
      )}
    </button>
  );
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

  // detect OS for shortcut hint
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        {/* Left: iTab icon + Space tabs */}
        <div className="flex items-center gap-2">
          {/* iTab icon (cycle spaces) */}
          <div className="group relative flex items-center">
            <button
              type="button"
              onClick={spaces.length > 1 ? switchNext : undefined}
              aria-label="Switch to next space"
              className="flex h-7 w-7 items-center justify-center rounded-lg opacity-80 transition hover:opacity-100 hover:scale-110 active:scale-95"
            >
              <ITabIcon className="h-7 w-7" />
            </button>
            {spaces.length > 1 && (
              <div className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-2 text-[0.65rem] font-semibold text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 z-50">
                <p className="mb-1 font-black tracking-wide text-white/60 uppercase text-[0.55rem]">Switch Space</p>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Next</span>
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-white">{modKey} →</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Prev</span>
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-white">{modKey} ←</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Space tabs – each is a droppable zone when editing */}
          <nav aria-label="Spaces" className="flex gap-1">
            {spaces.map((space) => (
              <DroppableSpaceTab
                key={space.id}
                space={space}
                isActive={space.id === currentSpaceId}
                editing={editing}
                onSpaceChange={onSpaceChange}
              />
            ))}
          </nav>
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

      {/* Search bar – centred, with shortcut hint */}
      <div className="flex justify-center px-4 pb-3">
        <button
          type="button"
          aria-label={t('searchPlaceholderBar')}
          onClick={onSearchClick}
          className="group flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/25 px-4 py-2.5 text-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.18)] transition hover:text-white/80"
          style={glassStyle(glass)}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left text-sm font-medium">{t('searchPlaceholderBar')}</span>
          <kbd className="hidden rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[0.6rem] text-white/50 group-hover:text-white/70 sm:inline-block">
            {modKey} K
          </kbd>
        </button>
      </div>
    </header>
  );
}
