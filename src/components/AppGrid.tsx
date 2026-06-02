import { FolderPlus, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import gsap from 'gsap';
import { AppIcon } from './AppIcon';
import type { AppShortcut, Folder, Space } from '../types';
import type { TranslationKey } from '../i18n';
import { GRID_CONTAINER_ID } from '../App';

export const FOLDER_DROP_PREFIX = 'folder-drop-';

type AppGridProps = {
  apps: AppShortcut[];
  folders: Folder[];
  editing: boolean;
  selectedFolderId: string | null;
  gridColumns: number;
  gridRows: number;
  currentSpaceId: string;
  spaces: Space[];
  spaceDirection?: 'left' | 'right' | null;
  pendingNavigatePage?: number | null;
  onNavigated?: () => void;
  onPageChange?: (page: number) => void;
  onCurrentPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  t: (key: TranslationKey) => string;
  activeId?: string | null;
  overContainer?: string | null;
  onOpenFolder: (folderId: string) => void;
  onCloseFolder: () => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onDeleteApp: (appId: string) => void;
  onRenameApp: (appId: string) => void;
  onAddShortcut: (folderId?: string | null) => void;
  onAddFolder: () => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onMoveToEnd: (appId: string) => void;
  onMoveToPage: (appId: string, pageIndex: number) => void;
  onMoveToFolder: (appId: string, folderId: string) => void;
  onMoveOutOfFolder: (appId: string) => void;
  onMoveToSpace: (appId: string, spaceId: string | undefined) => void;
  [key: string]: unknown;
};

type GridItem =
  | { kind: 'app'; id: string; app: AppShortcut }
  | { kind: 'folder'; id: string; folder: Folder; apps: AppShortcut[] };

const ICON_PX = 72;
const BADGE_PX = Math.round(ICON_PX * 0.28);
const BADGE_OFFSET = -Math.round(BADGE_PX * 0.35);

const glassBadgeBase: React.CSSProperties = {
  position: 'absolute', zIndex: 20,
  width: BADGE_PX, height: BADGE_PX, borderRadius: '50%',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(14px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.8)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
  border: '1px solid rgba(255,255,255,0.6)',
};
const removeBadgeStyle: React.CSSProperties = { ...glassBadgeBase, top: BADGE_OFFSET, left: BADGE_OFFSET };
const editBadgeStyle: React.CSSProperties   = { ...glassBadgeBase, top: BADGE_OFFSET, right: BADGE_OFFSET };
const spaceBadgeStyle: React.CSSProperties  = {
  position: 'absolute', bottom: BADGE_OFFSET, left: '50%', transform: 'translateX(-50%)',
  zIndex: 20, whiteSpace: 'nowrap', cursor: 'pointer',
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(10px) saturate(1.6)', WebkitBackdropFilter: 'blur(10px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.6)', borderRadius: 999,
  padding: '1px 6px', fontSize: '0.6rem', fontWeight: 900, color: '#334155',
  boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
};
const svgSize = BADGE_PX * 0.5;

function DeleteConfirmSheet({ title, message, onConfirm, onCancel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ animation: 'fadeIn 0.15s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative w-full max-w-xs overflow-hidden rounded-[1.6rem]"
        style={{
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(40px) saturate(1.8)', WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.6)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-[0.93rem] font-black text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{message}</p>
        </div>
        <div className="flex border-t border-slate-200/80">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100/60">Cancel</button>
          <span className="w-px bg-slate-200/80" />
          <button type="button" onClick={onConfirm}
            className="flex-1 py-3.5 text-sm font-black text-red-500 transition hover:bg-red-50/60">Delete</button>
        </div>
      </div>
    </div>
  );
}

function FolderPreview({ apps, isDropOver }: { apps: AppShortcut[]; isDropOver?: boolean }) {
  const previewApps = apps.slice(0, 4);
  return (
    <span
      className="grid h-[4.5rem] w-[4.5rem] grid-cols-2 grid-rows-2 place-items-center gap-1.5 rounded-[1.35rem] border border-white/55 bg-white/60 p-2.5 backdrop-blur-sm"
      style={{
        transform: isDropOver ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isDropOver
          ? 'inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 40px rgba(17,24,39,0.22), 0 0 0 3px rgba(255,255,255,0.8)'
          : 'inset 0 1px 0 rgba(255,255,255,0.6), 0 18px 40px rgba(17,24,39,0.22)',
        transition: 'box-shadow 100ms, transform 100ms',
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => {
        const app = previewApps[i];
        return app
          ? <AppIcon key={app.id} app={app} size="folder" />
          : <span key={`e-${i}`} className="h-5 w-5 rounded-[0.38rem] bg-white/40" />;
      })}
    </span>
  );
}

function IconWithBadges({
  app, editing, spaces, currentSpaceId, onDelete, onRename, onMoveToSpace,
}: {
  app: AppShortcut; editing: boolean; spaces: Space[]; currentSpaceId: string;
  onDelete: () => void; onRename: () => void; onMoveToSpace: (spaceId: string | undefined) => void;
}) {
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  return (
    <span className={['relative inline-flex', editing ? 'animate-jiggle' : ''].join(' ')}
      style={{ isolation: 'isolate' }} data-anim="app-icon">
      <AppIcon app={app} size="grid" />
      {editing && (
        <>
          <button type="button" aria-label="Delete shortcut"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            style={removeBadgeStyle}>
            <Minus style={{ width: svgSize, height: svgSize, color: '#ef4444', strokeWidth: 3 }} />
          </button>
          <button type="button" aria-label="Edit shortcut"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}
            style={editBadgeStyle}>
            <Pencil style={{ width: svgSize * 0.9, height: svgSize * 0.9, color: '#334155', strokeWidth: 2 }} />
          </button>
          <button type="button" aria-label="Move to space"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSpaceMenuOpen((v) => !v); }}
            style={spaceBadgeStyle}>
            {app.spaceId ? (spaces.find((s) => s.id === app.spaceId)?.name ?? app.spaceId) : '\u2736 All'}
          </button>
          {spaceMenuOpen && (
            <div className="absolute z-30 overflow-hidden rounded-2xl shadow-2xl"
              style={{
                bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-[9rem] py-1 text-xs font-black text-slate-800">
                <button type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-white/50"
                  onClick={(e) => { e.stopPropagation(); onMoveToSpace(undefined); setSpaceMenuOpen(false); }}>
                  <span className="text-slate-400">\u2736</span> All Spaces
                </button>
                {spaces.map((space) => (
                  <button key={space.id} type="button"
                    className={['flex w-full items-center gap-2 px-3 py-2 hover:bg-white/50',
                      space.id === currentSpaceId ? 'text-slate-950' : 'text-slate-600'].join(' ')}
                    onClick={(e) => { e.stopPropagation(); onMoveToSpace(space.id); setSpaceMenuOpen(false); }}>
                    <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${space.accent}`} />
                    {space.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </span>
  );
}

function FolderRenameOverlay({ name, onSave, onCancel, t }: {
  name: string; onSave: (n: string) => void; onCancel: () => void; t: (key: TranslationKey) => string;
}) {
  const [value, setValue] = useState(name);
  const handleSave = () => { if (!value.trim()) return; onSave(value.trim()); };
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-72 rounded-2xl bg-white p-6 shadow-2xl">
        <p className="mb-3 text-sm font-black text-slate-700">{t('renameFolder')}</p>
        <input autoFocus value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">{t('cancel')}</button>
          <button type="button" onClick={handleSave}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700">{t('save')}</button>
        </div>
      </div>
    </div>
  );
}

function DroppableFolderItem({
  item, editing, activeId, overContainer,
  onOpenFolder, onDeleteFolder, onRenameFolder,
}: {
  item: GridItem & { kind: 'folder' };
  editing: boolean;
  activeId?: string | null;
  overContainer?: string | null;
  onOpenFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string) => void;
}) {
  const dropId = `${FOLDER_DROP_PREFIX}${item.folder.id}`;

  const {
    attributes, listeners,
    setNodeRef: setSortableRef,
    transform, transition, isDragging,
  } = useSortable({
    id: item.id,
    data: { container: GRID_CONTAINER_ID },
    disabled: false,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { container: dropId, folderId: item.folder.id },
  });

  const mergedRef = (el: HTMLDivElement | null) => {
    setSortableRef(el);
    setDropRef(el);
  };

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || activeId === item.id ? 0.35 : 1,
    position: 'relative',
    touchAction: 'none',
  };

  const isDropTarget = isOver || overContainer === dropId;

  return (
    <div
      ref={mergedRef}
      style={sortableStyle}
      {...attributes}
      {...listeners}
      className="group relative flex min-h-[7.6rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] p-2 cursor-grab"
      data-anim="app-icon"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFolder(item.folder.id);
        }}
        className="flex flex-col items-center gap-2 rounded-[1.6rem] p-2 transition duration-200 hover:bg-white/12 active:scale-[0.98]"
      >
        <span
          className={['relative inline-flex', editing ? 'animate-jiggle' : ''].join(' ')}
          style={{ isolation: 'isolate' }}
        >
          <FolderPreview apps={item.apps} isDropOver={isDropTarget} />
          {editing && (
            <>
              <button type="button" aria-label="Delete folder"
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(item.folder.id); }}
                style={{ ...removeBadgeStyle, top: BADGE_OFFSET + 4, left: BADGE_OFFSET + 4 }}>
                <Trash2 style={{ width: svgSize, height: svgSize, color: '#ef4444', strokeWidth: 2.5 }} />
              </button>
              <button type="button" aria-label="Rename folder"
                onClick={(e) => { e.stopPropagation(); onRenameFolder(item.folder.id); }}
                style={{ ...editBadgeStyle, top: BADGE_OFFSET + 4, right: BADGE_OFFSET + 4 }}>
                <Pencil style={{ width: svgSize * 0.9, height: svgSize * 0.9, color: '#334155', strokeWidth: 2 }} />
              </button>
            </>
          )}
        </span>
        <span className="max-w-[6.4rem] truncate text-sm font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
          {item.folder.name}
        </span>
      </button>
    </div>
  );
}

function DraggableFolderApp({
  app, folderId, editing, spaces, currentSpaceId, activeId,
  onDelete, onRename, onMoveToSpace,
}: {
  app: AppShortcut;
  folderId: string;
  editing: boolean;
  spaces: Space[];
  currentSpaceId: string;
  activeId?: string | null;
  onDelete: () => void;
  onRename: () => void;
  onMoveToSpace: (spaceId: string | undefined) => void;
}) {
  const containerId = `${FOLDER_DROP_PREFIX}${folderId}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    data: { container: containerId },
    disabled: !editing,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
    opacity: isDragging || activeId === app.id ? 0.35 : 1,
    touchAction: 'none',
    cursor: editing ? 'grab' : 'default',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(editing ? listeners : {})}
      className="relative flex flex-col items-center gap-2 rounded-[1.4rem] p-2"
    >
      <a
        href={editing ? undefined : app.url}
        onClick={(e) => { if (editing) e.preventDefault(); }}
        className="flex flex-col items-center gap-2 rounded-[1.4rem] p-1 transition duration-200 hover:bg-white/12"
      >
        <IconWithBadges
          app={app} editing={editing} spaces={spaces} currentSpaceId={currentSpaceId}
          onDelete={onDelete}
          onRename={onRename}
          onMoveToSpace={onMoveToSpace}
        />
        <span className="max-w-[5.6rem] truncate text-xs font-bold text-white">{app.name}</span>
      </a>
    </div>
  );
}

function SortableGridItem({
  item, editing, spaces, currentSpaceId, activeId, overContainer,
  onDeleteApp, onRenameApp, onMoveToSpace, onOpenFolder, onDeleteFolder, onRenameFolder,
}: {
  item: GridItem;
  editing: boolean;
  spaces: Space[];
  currentSpaceId: string;
  activeId?: string | null;
  overCo