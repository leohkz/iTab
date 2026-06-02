import { FolderPlus, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

function PageDots({ total, current, onSelect }: { total: number; current: number; onSelect: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-[7px]">
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} type="button" aria-label={`Page ${i + 1}`} onClick={() => onSelect(i)}
          className="transition-all"
          style={{
            width: i === current ? 8 : 7, height: i === current ? 8 : 7,
            borderRadius: '50%',
            background: i === current ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.35)',
            boxShadow: i === current ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
            border: 'none', padding: 0, cursor: 'pointer',
          }}
        />
      ))}
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
        target="_blank" rel="noreferrer"
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
  overContainer?: string | null;
  onDeleteApp: (id: string) => void;
  onRenameApp: (id: string) => void;
  onMoveToSpace: (id: string, spaceId: string | undefined) => void;
  onOpenFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string) => void;
}) {
  if (item.kind === 'folder') {
    return (
      <DroppableFolderItem
        item={item}
        editing={editing}
        activeId={activeId}
        overContainer={overContainer}
        onOpenFolder={onOpenFolder}
        onDeleteFolder={onDeleteFolder}
        onRenameFolder={onRenameFolder}
      />
    );
  }

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: item.id,
    data: { container: GRID_CONTAINER_ID },
    disabled: false,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || activeId === item.id ? 0.35 : 1,
    position: 'relative',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex min-h-[7.6rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] p-2 cursor-grab"
      data-testid={`link-app-${item.app.id}`}
    >
      <a
        href={editing ? undefined : item.app.url}
        target="_blank" rel="noreferrer"
        onClick={(e) => { if (editing) { e.preventDefault(); e.stopPropagation(); } }}
        className="flex flex-col items-center gap-2 rounded-[1.6rem] p-2 transition duration-200 hover:bg-white/12 active:scale-[0.98]"
      >
        <IconWithBadges
          app={item.app} editing={editing} spaces={spaces} currentSpaceId={currentSpaceId}
          onDelete={() => onDeleteApp(item.app.id)}
          onRename={() => onRenameApp(item.app.id)}
          onMoveToSpace={(spaceId) => onMoveToSpace(item.app.id, spaceId)}
        />
        <span className="max-w-[6.4rem] truncate text-sm font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
          {item.app.name}
        </span>
      </a>
    </div>
  );
}

function DroppableGrid({ id, children, isOver }: { id: string; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id, data: { container: id } });
  return (
    <div ref={setNodeRef}
      className={['mx-auto grid gap-x-7 gap-y-8 rounded-[2.3rem] p-6 transition-colors duration-200',
        isOver ? 'ring-2 ring-white/30 ring-inset' : ''].join(' ')}
      style={{ gridTemplateColumns: 'var(--grid-cols)', maxWidth: 'var(--grid-max-w)' }}
    >
      {children}
    </div>
  );
}

export function AppGrid({
  apps, folders, editing, selectedFolderId, gridColumns, gridRows: _gridRows,
  currentSpaceId, spaces, spaceDirection, pendingNavigatePage, onNavigated, onPageChange, t,
  activeId, overContainer,
  onOpenFolder, onCloseFolder,
  onDeleteApp, onRenameApp, onAddShortcut, onAddFolder, onRenameFolder, onDeleteFolder,
  onMoveToSpace, onMoveToPage: _onMoveToPage,
}: AppGridProps) {
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;
  const selectedFolderApps = selectedFolder ? apps.filter((a) => a.folderId === selectedFolder.id) : [];
  const renamingFolder = folders.find((f) => f.id === renamingFolderId) ?? null;
  const deletingApp = apps.find((a) => a.id === deletingAppId) ?? null;

  const itemsByPage = useMemo(() => {
    const map = new Map<number, GridItem[]>();

    for (const app of apps) {
      if (app.folderId) continue;
      const p = app.pageIndex ?? 0;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push({ kind: 'app', id: app.id, app });
    }

    for (const folder of folders) {
      const p = folder.pageIndex ?? 0;
      if (!map.has(p)) map.set(p, []);
      const folderApps = apps.filter((a) => a.folderId === folder.id);
      map.get(p)!.push({ kind: 'folder', id: folder.id, folder, apps: folderApps });
    }

    return map;
  }, [apps, folders]);

  const totalPages = useMemo(() => {
    if (itemsByPage.size === 0) return 1;
    return Math.max(...itemsByPage.keys()) + 1;
  }, [itemsByPage]);

  const goToPage = useCallback((page: number, dir?: 'left' | 'right') => {
    if (page === currentPage || animating) return;
    setSlideDir(dir ?? (page > currentPage ? 'right' : 'left'));
    setAnimating(true);
    setCurrentPage(page);
    onPageChange?.(page);
    setTimeout(() => setAnimating(false), 320);
  }, [currentPage, animating, onPageChange]);

  useEffect(() => {
    if (pendingNavigatePage != null && pendingNavigatePage !== currentPage) {
      goToPage(pendingNavigatePage);
      onNavigated?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNavigatePage]);

  useEffect(() => {
    if (spaceDirection) {
      setSlideDir(spaceDirection === 'right' ? 'left' : 'right');
      setAnimating(true);
      setCurrentPage(0);
      onPageChange?.(0);
      setTimeout(() => setAnimating(false), 320);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceDirection]);

  const currentItems = itemsByPage.get(currentPage) ?? [];
  const sortableIds = currentItems.map((item) => item.id);

  const isGridOver = overContainer === GRID_CONTAINER_ID;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    const dy = e.clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0 && currentPage < totalPages - 1) goToPage(currentPage + 1, 'right');
    if (dx > 0 && currentPage > 0) goToPage(currentPage - 1, 'left');
  }, [currentPage, totalPages, goToPage]);

  const slideStyle: React.CSSProperties = animating
    ? { animation: `slide-${slideDir} 0.28s cubic-bezier(0.32,0,0.67,0) both` }
    : {};

  return (
    <main
      ref={mainRef}
      className="relative flex flex-col items-center justify-center"
      style={{
        minHeight: '100vh',
        paddingTop: '5.5rem',
        paddingBottom: '6.5rem',
        ['--grid-cols' as string]: `repeat(${gridColumns}, minmax(0, 1fr))`,
        ['--grid-max-w' as string]: `${gridColumns * (ICON_PX + 56)}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div style={slideStyle} className="w-full">
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <DroppableGrid id={GRID_CONTAINER_ID} isOver={isGridOver}>
            {currentItems.map((item) => (
              <SortableGridItem
                key={item.id}
                item={item}
                editing={editing}
                spaces={spaces}
                currentSpaceId={currentSpaceId}
                activeId={activeId}
                overContainer={overContainer}
                onDeleteApp={(id) => setDeletingAppId(id)}
                onRenameApp={onRenameApp}
                onMoveToSpace={onMoveToSpace}
                onOpenFolder={onOpenFolder}
                onDeleteFolder={(id) => {
                  if (item.kind === 'folder') onDeleteFolder(id);
                }}
                onRenameFolder={(id) => setRenamingFolderId(id)}
              />
            ))}
            {editing && (
              <>
                <div
                  className="flex min-h-[7.6rem] flex-col items-center justify-center gap-2 rounded-[1.6rem] border-2 border-dashed border-white/30 p-2 cursor-pointer transition hover:border-white/60 hover:bg-white/8"
                  onClick={() => onAddShortcut()}
                >
                  <Plus className="h-6 w-6 text-white/50" />
                  <span className="text-xs font-bold text-white/50">{t('addWebsite')}</span>
                </div>
                <div
                  className="flex min-h-[7.6rem] flex-col items-center justify-center gap-2 rounded-[1.6rem] border-2 border-dashed border-white/30 p-2 cursor-pointer transition hover:border-white/60 hover:bg-white/8"
                  onClick={onAddFolder}
                >
                  <FolderPlus className="h-6 w-6 text-white/50" />
                  <span className="text-xs font-bold text-white/50">{t('newFolder')}</span>
                </div>
              </>
            )}
          </DroppableGrid>
        </SortableContext>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <PageDots total={totalPages} current={currentPage} onSelect={(i) => goToPage(i)} />
        </div>
      )}

      {selectedFolder && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onPointerDown={(e) => { if (e.target === e.currentTarget) onCloseFolder(); }}
          style={{ animation: 'fadeIn 0.15s ease' }}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] p-6"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(40px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.3)',
              animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-black text-white">{selectedFolder.name}</p>
              <button type="button" onClick={onCloseFolder}
                className="rounded-xl bg-white/20 px-3 py-1 text-xs font-black text-white hover:bg-white/30">
                {t('done')}
              </button>
            </div>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.ceil(Math.sqrt(selectedFolderApps.length + (editing ? 1 : 0))))}, minmax(0,1fr))` }}
            >
              {selectedFolderApps.map((app) => (
                <DraggableFolderApp
                  key={app.id}
                  app={app}
                  folderId={selectedFolder.id}
                  editing={editing}
                  spaces={spaces}
                  currentSpaceId={currentSpaceId}
                  activeId={activeId}
                  onDelete={() => setDeletingAppId(app.id)}
                  onRename={() => onRenameApp(app.id)}
                  onMoveToSpace={(spaceId) => onMoveToSpace(app.id, spaceId)}
                />
              ))}
              {editing && (
                <div
                  className="flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-[1.2rem] border-2 border-dashed border-white/30 cursor-pointer hover:border-white/60"
                  onClick={() => onAddShortcut(selectedFolder.id)}
                >
                  <Plus className="h-5 w-5 text-white/50" />
                  <span className="text-[0.65rem] font-bold text-white/50">{t('addWebsite')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {renamingFolder && (
        <FolderRenameOverlay
          name={renamingFolder.name}
          onSave={(name) => { onRenameFolder(renamingFolder.id, name); setRenamingFolderId(null); }}
          onCancel={() => setRenamingFolderId(null)}
          t={t}
        />
      )}

      {deletingApp && (
        <DeleteConfirmSheet
          title={t('delete')}
          message={deletingApp.name}
          onConfirm={() => { onDeleteApp(deletingAppId!); setDeletingAppId(null); }}
          onCancel={() => setDeletingAppId(null)}
        />
      )}
    </main>
  );
}
