// TopBar with droppable Space zones when editing
import { Settings, Search, Pencil, PencilOff } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { Space } from '../types';
import type { TranslationKey } from '../i18n';
import type { WidgetState } from '../types';

type TopBarProps = {
  spaces: Space[];
  currentSpaceId: string;
  editing: boolean;
  syncStatus: string;
  glass: number;
  t: (key: TranslationKey) => string;
  widgets: WidgetState;
  onSpaceChange: (id: string) => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onToggleEditing: () => void;
  onToggleTheme: () => void;
  onWidgetsChange: (widgets: WidgetState) => void;
  [key: string]: unknown;
};

export const SPACE_DROP_PREFIX = 'space-drop-';

function DroppableSpaceButton({
  space, isActive, glass, editing, onSpaceChange,
}: {
  space: Space;
  isActive: boolean;
  glass: number;
  editing: boolean;
  onSpaceChange: (id: string) => void;
}) {
  const dropId = `${SPACE_DROP_PREFIX}${space.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { container: dropId, spaceId: space.id },
    disabled: !editing,
  });

  const alpha = Math.min(0.40, Math.max(0.08, glass / 280));
  const blur  = Math.round(4 + glass / 10);

  const bgStyle: React.CSSProperties = isActive
    ? {
        backgroundColor: `rgba(255,255,255,${alpha * 1.8})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
      }
    : {
        backgroundColor: isOver ? `rgba(255,255,255,${alpha * 1.5})` : 'transparent',
        backdropFilter: isOver ? `blur(${blur}px)` : 'none',
        WebkitBackdropFilter: isOver ? `blur(${blur}px)` : 'none',
      };

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSpaceChange(space.id)}
      className={[
        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all duration-150',
        isActive ? 'text-white shadow-sm' : 'text-white/60 hover:text-white',
        isOver && !isActive ? 'ring-2 ring-white/50 ring-offset-0 scale-105 text-white' : '',
      ].join(' ')}
      style={bgStyle}
    >
      <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${space.accent} flex-shrink-0`} />
      <span>{space.name}</span>
      {isOver && (
        <span className="ml-1 animate-pulse text-[0.6rem] font-black tracking-wide text-white/80">drop</span>
      )}
    </button>
  );
}

export function TopBar({
  spaces, currentSpaceId, editing, glass, t,
  onSpaceChange, onSearchClick, onSettingsClick, onToggleEditing, onToggleTheme: _onToggleTheme,
  onWidgetsChange: _onWidgetsChange, widgets: _widgets, syncStatus: _syncStatus,
}: TopBarProps) {
  const alpha = Math.min(0.40, Math.max(0.08, glass / 280));
  const blur  = Math.round(4 + glass / 10);
  const barBg: React.CSSProperties = {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-2 px-4 py-2"
      style={barBg}
    >
      {/* Space selector — each button is a drop zone when editing */}
      <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Spaces">
        {spaces.map((space) => (
          <DroppableSpaceButton
            key={space.id}
            space={space}
            isActive={space.id === currentSpaceId}
            glass={glass}
            editing={editing}
            onSpaceChange={onSpaceChange}
          />
        ))}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          aria-label={t('search')}
          onClick={onSearchClick}
          className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={editing ? t('done') : t('edit')}
          onClick={onToggleEditing}
          className={['rounded-xl p-2 transition hover:bg-white/10', editing ? 'text-white' : 'text-white/70 hover:text-white'].join(' ')}
        >
          {editing ? <PencilOff className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
        <button
          type="button"
          aria-label={t('settings')}
          onClick={onSettingsClick}
          className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
