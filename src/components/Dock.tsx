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
const GAP = 12;
const PAD_X = 20;
const PAD_Y = 12;

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
  onReorderPinned: (draggedId: string, targetIndex: number) => void;
  [key: string]: unknown;
};

function badgeSize(scale: number) {
  return Math.max(18, Math.round(BASE * scale * 0.28));
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

// Returns scale 1.0 ~ MAX/BASE per icon based on cursor distance
function useDockScales(count: number, editing: boolean) {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const slotRefs = useRef<(HTMLLIElement | null)[]>([]);

  const scales: number[] = editing || mouseX === null
    ? Array(count).fill(1)
    : slotRefs.current.map((el) => {
        if (!el) return 1;
        const rect = el.getBoundingClientRect();
        // Centre of the fixed BASE slot
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(mouseX - center);
        if (dist >= SPREAD) return 1;
        const t = 1 - dist / SPREAD;
        // Linear falloff (matches the original HTML5 version feel)
        return 1 + (MAX / BASE - 1) * t;
      });

  return { scales, slotRefs, setMouseX };
}

function SortableDockItem({
  app, editing, scale, slotRef, onConfirmDelete, onRename,
}: {
  app: AppShortcut;
  editing: boolean;
  scale: number;
  slotRef: (el: HTMLLIElement | null) => void;
  onConfirmDelete: () => void;
  onRename: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { container: DOCK_CONTAINER_ID },
  });

  const bSize = badgeSize(scale);
  const badgeOffset = Math.round(bSize * -0.28);

  // Slot: always BASE×BASE, never changes — pill stays static
  const slotStyle: React.CSSProperties = {
    position: 'relative',
    width: BASE,
    height: BASE,
    flexShrink: 0,
    touchAction: 'none',
    opacity: isDragging ? 0.3 : 1,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    zIndex: scale > 1 ? 10 : 1,
    overflow: 'visible',
  };

  // Icon: CSS scale from bottom-center, grows upward without affecting layout
  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Math.round(BASE * 0.22),
    overflow: 'hidden',
    isolation: 'isolate',
    transformOrigin: 'bottom center',
    transform: `scale(${scale}) translateY(${((scale - 1) * BASE) / 2 / scale}px)`,
    // Smooth spring-like transition matching original feel
    transition: 'transform 0.15s cubic-bezier(0.34, 1.4, 0.64, 1)',
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
    transition: 'width 0.15s ease, height 0.15s ease',
  };

  return (
    <li
      ref={(el) => { setNodeRef(el); slotRef(el); }}
      style={slotStyle}
      className="app"
      data-testid={`dock-pinned-${app.id}`}
      {...(editing ? { ...attributes, ...listeners } : {})}
    >
      {editing ? (
        <span
          className="animate-jiggle"
          aria-label={app.name}
          style={{ position: 'absolute', inset: 0 }}
        >
          <span style={iconStyle}>
            <AppIcon app={app} size="dock" />
          </span>
          <button type="button" aria-label={`Remove ${app.name} from dock`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onConfirmDelete(); }}
            style={{ ...badgeBase, top: badgeOffset, left: badgeOffset }}
          >
            <Minus style={{ width: bSize * 0.48, height: bSize * 0.48, color: '#ef4444', strokeWidth: 3 }} />
          </button>
          <button type="button" aria-label={`Edit ${app.name}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}
            style={{ ...badgeBase, top: badgeOffset, right: badgeOffset }}
          >
            <Pencil style={{ width: bSize * 0.44, height: bSize * 0.44, color: '#334155', strokeWidth: 2 }} />
          </button>
        </span>
      ) : (
        <a
          href={app.url} target="_blank" rel="noreferrer"
          aria-label={`Open ${app.name}`}
          style={{ position: 'absolute', inset: 0 }}
          {...attributes} {...listeners}
        >
          <span style={iconStyle}>
            <AppIcon app={app} size="dock" />
          </span>
        </a>
      )}
    </li>
  );
}

function DroppableDock({ children, count, onMouseMove, onMouseLeave }: {
  children: React.ReactNode;
  count: number;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: DOCK_CONTAINER_ID,
    data: { container: DOCK_CONTAINER_ID },
  });

  const pillW = count * BASE + Math.max(0, count - 1) * GAP + PAD_X * 2;
  const pillH = BASE + PAD_Y * 2;

  return (
    <div style={{ width: pillW, height: pillH, position: 'relative' }}>
      <ul
        ref={setNodeRef}
        style={{
          position: 'absolute',
          bottom: PAD_Y,
          left: PAD_X,
          display: 'flex',
          alignItems: 'flex-end',
          gap: GAP,
          overflow: 'visible',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </ul>
    </div>
  );
}

export function Dock({
  pinnedApps, recentTabs: _recentTabs, editing, glass,
  activeId, overContainer,
  onDropApp: _onDropApp, onUnpinApp, onRenameApp, onReorderPinned: _onReorderPinned,
}: DockProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { scales, slotRefs, setMouseX } = useDockScales(pinnedApps.length, editing);

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
    <div
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
      style={{ overflow: 'visible' }}
    >
      <div
        className="rounded-[2rem] border border-white/35 shadow-[0_8px_40px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.5)]"
        style={{ ...dockBg, overflow: 'visible', display: 'inline-block' }}
      >
        <SortableContext items={pinnedIds} strategy={horizontalListSortingStrategy}>
          <DroppableDock
            count={pinnedApps.length}
            onMouseMove={(e) => setMouseX(e.clientX)}
            onMouseLeave={() => setMouseX(null)}
          >
            {pinnedApps.map((app, i) => (
              <SortableDockItem
                key={app.id}
                app={app}
                editing={editing}
                scale={scales[i] ?? 1}
                slotRef={(el) => { slotRefs.current[i] = el; }}
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
