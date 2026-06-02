import { Minus, Pencil } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppIcon } from './AppIcon';
import type { AppShortcut } from '../types';
import { DOCK_CONTAINER_ID } from '../App';

const BASE = 52;
const MAX  = 82;
const SPREAD = 130;

type DockProps = {
  pinnedApps: AppShortcut[];
  recentTabs: AppShortcut[];
  editing: boolean;
  glass: number;
  activeId?: string | null;
  overContainer?: string | null;
  onDropApp: (appId: string) => void;
  onUnpinApp: (appId: string) => void;
  onRenameApp: (appId: string) => void;
  onReorderPinned: (draggedId: string, overId: string) => void;
  [key: string]: unknown;
};

function badgeSize(iconSize: number) {
  return Math.max(18, Math.round(iconSize * 0.28));
}

function DockDeleteConfirm({ name, onConfirm, onCancel }: {
  name: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center pb-40"
      style={{ animation: 'fadeIn 0.15s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="mx-4 w-full max-w-xs overflow-hidden rounded-[1.6rem] shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          border: '1px solid rgba(255,255,255,0.55)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 text-center">
          <p className="text-[0.93rem] font-black text-slate-900">Remove from Dock?</p>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">&ldquo;{name}&rdquo;</p>
        </div>
        <div className="flex border-t border-slate-200/70">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/60">Cancel</button>
          <span className="w-px bg-slate-200/70" />
          <button type="button" onClick={onConfirm}
            className="flex-1 py-3 text-sm font-black text-red-500 transition hover:bg-red-50/60">Remove</button>
        </div>
      </div>
    </div>
  );
}

function useDockSizes(count: number, editing: boolean) {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const sizes = editing || mouseX === null
    ? (Array(count).fill(BASE) as number[])
    : itemRefs.current.map((el) => {
        if (!el) return BASE;
        const rect = el.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(mouseX - center);
        if (dist >= SPREAD) return BASE;
        const t = 1 - dist / SPREAD;
        return BASE + (MAX - BASE) * t * t;
      });

  return { sizes, itemRefs, setMouseX };
}

function SortableDockItem({
  app, editing, size, liRef, onConfirmDelete, onRename,
}: {
  app: AppShortcut;
  editing: boolean;
  size: number;
  liRef: (el: HTMLLIElement | null) => void;
  onConfirmDelete: () => void;
  onRename: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { container: DOCK_CONTAINER_ID },
  });

  const marginTop = BASE - size;
  const bSize = badgeSize(size);
  const offset = Math.round(bSize * -0.28);
  const wrapRadius = Math.round(size * 0.3);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    marginTop,
    opacity: isDragging ? 0.3 : 1,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'width 0.12s ease, height 0.12s ease, margin-top 0.12s ease',
    position: 'relative',
    touchAction: 'none',
    flexShrink: 0,
    overflow: 'visible',
    zIndex: 1,
  };

  const iconWrapper: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
    borderRadius: wrapRadius,
    isolation: 'isolate',
  };

  const badgeBase: React.CSSProperties = {
    position: 'absolute', zIndex: 20,
    width: bSize, height: bSize,
    borderRadius: '50%',
    display: 'grid', placeItems: 'center',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.6)',
  };

  return (
    <li
      ref={(el) => { setNodeRef(el); liRef(el); }}
      style={style}
      className="app"
      data-testid={`dock-pinned-${app.id}`}
      {...attributes}
      {...listeners}
    >
      {editing ? (
        <span className="app-link animate-jiggle" aria-label={app.name}
          style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
          <span style={iconWrapper}><AppIcon app={app} size="dock" /></span>
          <button type="button" aria-label={`Remove ${app.name} from dock`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConfirmDelete(); }}
            style={{ ...badgeBase, top: offset, left: offset }}
          >
            <Minus style={{ width: bSize * 0.48, height: bSize * 0.48, color: '#ef4444', strokeWidth: 3 }} />
          </button>
          <button type="button" aria-label={`Edit ${app.name}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}
            style={{ ...badgeBase, top: offset, right: offset }}
          >
            <Pencil style={{ width: bSize * 0.44, height: bSize * 0.44, color: '#334155', strokeWidth: 2 }} />
          </button>
        </span>
      ) : (
        <a href={app.url} target="_blank" rel="noreferrer" aria-label={`Open ${app.name}`}
          style={{ display: 'flex', width: '100%', height: '100%' }}
        >
          <span style={iconWrapper}><AppIcon app={app} size="dock" /></span>
        </a>
      )}
    </li>
  );
}

function DroppableDock({ children, isOver, onMouseMove, onMouseLeave }: {
  children: React.ReactNode;
  isOver: boolean;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: DOCK_CONTAINER_ID,
    data: { container: DOCK_CONTAINER_ID },
  });
  return (
    <ul
      ref={setNodeRef}
      className={[
        'relative flex items-end gap-3 px-5 py-3 transition-all duration-200 overflow-visible',
        isOver ? 'scale-[1.03]' : '',
      ].join(' ')}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </ul>
  );
}

export function Dock({
  pinnedApps, recentTabs: _recentTabs, editing, glass,
  activeId, overContainer,
  onDropApp: _onDropApp, onUnpinApp, onRenameApp, onReorderPinned: _onReorderPinned,
}: DockProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { sizes, itemRefs, setMouseX } = useDockSizes(pinnedApps.length, editing);

  const alpha = Math.min(0.48, Math.max(0.12, glass / 220));
  const blur  = Math.round(6 + glass / 10);
  const dockBg: React.CSSProperties = {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px) saturate(1.8)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(1.8)`,
  };

  const isDockOver = overContainer === DOCK_CONTAINER_ID;
  const confirmApp = pinnedApps.find((a) => a.id === confirmDeleteId);
  const pinnedIds = pinnedApps.map((a) => a.id);

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
      style={{ overflow: 'visible' }}
    >
      <div
        className="rounded-[2rem] border border-white/35 shadow-[0_8px_40px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.5)]"
        style={{ ...dockBg, overflow: 'visible' }}
      >
        <SortableContext items={pinnedIds} strategy={horizontalListSortingStrategy}>
          <DroppableDock
            isOver={isDockOver}
            onMouseMove={(e) => setMouseX(e.clientX)}
            onMouseLeave={() => setMouseX(null)}
          >
            {pinnedApps.map((app, i) => (
              <SortableDockItem
                key={app.id}
                app={app}
                editing={editing}
                size={sizes[i] ?? BASE}
                liRef={(el) => { itemRefs.current[i] = el; }}
                onConfirmDelete={() => setConfirmDeleteId(app.id)}
                onRename={() => onRenameApp(app.id)}
              />
            ))}
          </DroppableDock>
        </SortableContext>
      </div>

      {isDockOver && !editing && activeId && !pinnedIds.includes(activeId) && (
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          Drop to pin
        </div>
      )}

      {confirmApp && (
        <DockDeleteConfirm
          name={confirmApp.name}
          onConfirm={() => { onUnpinApp(confirmApp.id); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
