import { Minus, Pencil } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useDroppable, useSortable, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
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
  /** Active drag ID from top-level DndContext */
  activeId?: string | null;
  /** Which container the active drag is hovering */
  overContainer?: string | null;
  onDropApp: (appId: string) => void;
  onUnpinApp: (appId: string) => void;
  onRenameApp: (appId: string) => void;
  onReorderPinned: (draggedId: string, targetIndex: number) => void;
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

// ── Single sortable dock item ─────────────────────────────────────────────
function SortableDockItem({
  app, editing, size, onConfirmDelete, onRename,
}: {
  app: AppShortcut;
  editing: boolean;
  size: number;
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
    transition,
    position: 'relative',
    touchAction: 'none',
  };

  const iconWrapper: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
    borderRadius: wrapRadius,
    overflow: 'hidden', isolation: 'isolate',
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
      ref={setNodeRef}
      style={style}
      className="app"
      data-testid={`dock-pinned-${app.id}`}
      {...(editing ? { ...attributes, ...listeners } : {})}
    >
      {editing ? (
        <span className="app-link animate-jiggle" aria-label={app.name}>
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
          {...attributes} {...listeners}
        >
          <span style={iconWrapper}><AppIcon app={app} size="dock" /></span>
        </a>
      )}
