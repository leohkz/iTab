import { FolderPlus, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppIcon } from './AppIcon';
import type { AppShortcut, Folder, Space } from '../types';
import type { TranslationKey } from '../i18n';
import { GRID_CONTAINER_ID } from '../App';

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
const removeBadgeStyle: React.CSSProperties  = { ...glassBadgeBase, top: BADGE_OFFSET, left: BADGE_OFFSET };
const editBadgeStyle: React.CSSProperties    = { ...glassBadgeBase, top: BADGE_OFFSET, right: BADGE_OFFSET };
const spaceBadgeStyle: React.CSSProperties   = {
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

function FolderPreview({ apps }: { apps: AppShortcut[] }) {
  const previewApps = apps.slice(0, 4);
  return (
    <span className="grid h-[5.4rem] w-[5.4rem] grid-cols-2 grid-rows-2 place-items-center gap-2 rounded-[1.55rem] border border-white/35 bg-white/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_40px_rgba(17,24,39,0.2)] backdrop-blur-sm">
      {Array.from({ length: 4 }).map((_, i) => {
        const app = previewApps[i];
        return app
          ? <AppIcon key={app.id} app={app} size="mini" />
          : <span key={`e-${i}`} className="h-6 w-6 rounded-[0.48rem] bg-white/22" />;
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
            {app.spaceId ? (spaces.find((s) => s.id === app.spaceId)?.name ?? app.spaceId) : '✶ All'}
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
                  <span className="text-slate-400">✶</span> All Spaces
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

function SortableGridItem({
  item, editing, spaces, currentSpaceId, activeId,
  onDeleteApp, onRenameApp, onMoveToSpace, onOpenFolder, onDeleteFolder, onRenameFolder,
}: {
  item: GridItem;
  editing: boolean;
  spaces: Space[];
  currentSpaceId: string;
  activeId?: string | null;
  onDeleteApp: (id: string) => void;
  onRenameApp: (id: string) => void;
  onMoveToSpace: (id: string, spaceId: string | undefined) => void;
  onOpenFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { container: GRID_CONTAINER_ID },
    disabled: !editing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || activeId === item.id ? 0.35 : 1,
    position: 'relative',
    touchAction: 'none',
  };

  const cellClass = [
    'group relative flex min-h-[7.6rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] p-2',
    editing ? 'cursor-grab' : '',
  ].join(' ');

  if (item.kind === 'folder') {
    return (
      <div ref={setNodeRef} style={style} className={cellClass}
        {...(editing ? { ...attributes, ...listeners } : {})}
        data-anim="app-icon"
      >
        <button type="button"
          onClick={(e) => { if (editing) { e.stopPropagation(); return; } onOpenFolder(item.folder.id); }}
          className="flex flex-col items-center gap-2 rounded-[1.6rem] p-2 transition duration-200 hover:bg-white/12 active:scale-[0.98]"
        >
          <span className={['relative inline-flex', editing ? 'animate-jiggle' : ''].join(' ')} style={{ isolation: 'isolate' }}>
            <FolderPreview apps={item.apps} />
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

  return (
    <div ref={setNodeRef} style={style} className={cellClass}
      {...(editing ? { ...attributes, ...listeners } : {})}
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
  apps, folders, editing, selectedFolderId, gridColumns, gridRows,
  currentSpaceId, spaces, spaceDirection, pendingNavigatePage, onNavigated, t,
  activeId, overContainer,
  onOpenFolder, onCloseFolder, onStartEditing, onStopEditing,
  onDeleteApp, onRenameApp, onAddShortcut, onAddFolder, onRenameFolder, onDeleteFolder,
  onMoveToSpace,
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

  const pageCapacity = gridColumns * gridRows;

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
      map.get(p)!.push({ kind: 'folder', id: folder.id, folder, apps: apps.filter((a) => a.folderId === folder.id) });
    }
    // sort each page by position field
    for (const items of map.values()) {
      items.sort((a, b) => {
        const posA = a.kind === 'app' ? (a.app.position ?? 0) : (a.folder.pageIndex ?? 0);
        const posB = b.kind === 'app' ? (b.app.position ?? 0) : (b.folder.pageIndex ?? 0);
        return posA - posB;
      });
    }
    return map;
  }, [apps, folders]);

  const totalPages = useMemo(() => {
    if (itemsByPage.size === 0) return 1;
    return Math.max(...itemsByPage.keys()) + 1;
  }, [itemsByPage]);

  // clamp currentPage if items shrink
  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
  }, [totalPages, currentPage]);

  const itemsOnPage = itemsByPage.get(currentPage) ?? [];

  useEffect(() => {
    if (pendingNavigatePage != null) { setCurrentPage(pendingNavigatePage); onNavigated?.(); }
  }, [pendingNavigatePage, onNavigated]);

  useEffect(() => { setCurrentPage(0); }, [currentSpaceId]);

  const goToPage = useCallback((page: number) => {
    if (page === currentPage || animating) return;
    const dir = page > currentPage ? 'left' : 'right';
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => { setCurrentPage(page); setSlideDir(null); setAnimating(false); }, 320);
  }, [currentPage, animating]);

  const goNext = useCallback(() => { if (currentPage < totalPages - 1) goToPage(currentPage + 1); }, [currentPage, totalPages, goToPage]);
  const goPrev = useCallback(() => { if (currentPage > 0) goToPage(currentPage - 1); }, [currentPage, goToPage]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target instanceof Element && e.target.closest('a,button,input')) return;
    swipeStartX.current = e.clientX; swipeStartY.current = e.clientY;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    const dy = e.clientY - swipeStartY.current;
    swipeStartX.current = null; swipeStartY.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const setLongPress = (target: HTMLElement) => {
    const timeout = window.setTimeout(onStartEditing, 520);
    const clear = () => window.clearTimeout(timeout);
    target.addEventListener('pointerup', clear, { once: true });
    target.addEventListener('pointerleave', clear, { once: true });
  };

  let pageSlideStyle: React.CSSProperties;
  if (animating && slideDir) {
    pageSlideStyle = { transform: slideDir === 'left' ? 'translateX(-6%)' : 'translateX(6%)', opacity: 0, transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s' };
  } else {
    pageSlideStyle = { transform: 'translateX(0)', opacity: 1, transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s' };
  }

  const spaceAnimStyle: React.CSSProperties = spaceDirection ? {
    animation: spaceDirection === 'right'
      ? 'spaceSlideFromRight 0.32s cubic-bezier(0.4,0,0.2,1) both'
      : 'spaceSlideFromLeft 0.32s cubic-bezier(0.4,0,0.2,1) both',
  } : {};

  const isGridOver = overContainer === GRID_CONTAINER_ID;
  const sortableIds = itemsOnPage.map((i) => i.id);
  const gridCssVars = {
    '--grid-cols': `repeat(${gridColumns}, minmax(5.8rem, 1fr))`,
    '--grid-max-w': `${gridColumns * 7.5}rem`,
  } as React.CSSProperties;

  return (
    <main
      ref={mainRef}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-28 pt-28"
      data-testid="main-new-tab"
      data-anim="appgrid"
      tabIndex={editing ? 0 : undefined}
      onKeyDown={(e) => { if (editing && e.key === 'Escape') onStopEditing(); }}
      onContextMenu={(e) => { e.preventDefault(); onStartEditing(); }}
      onClick={(e) => { if (editing && e.target === mainRef.current) onStopEditing(); }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={gridCssVars}
    >
      <style>{`
        @keyframes spaceSlideFromRight { from { opacity:0; transform:translateX(48px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spaceSlideFromLeft  { from { opacity:0; transform:translateX(-48px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {editing && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex justify-center pt-4" aria-live="polite">
          <span className="rounded-full bg-slate-950/60 px-4 py-1.5 text-xs font-bold tracking-wide text-white/80 backdrop-blur-md">
            ✏️ {t('editModeHint')}
          </span>
        </div>
      )}

      <section key={currentSpaceId} className="w-full max-w-5xl" aria-label="App grid" style={spaceAnimStyle}>
        <div style={pageSlideStyle}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <DroppableGrid id={GRID_CONTAINER_ID} isOver={isGridOver}>
              {itemsOnPage.map((item) => (
                <div key={item.id} onPointerDown={(e) => setLongPress(e.currentTarget)}>
                  <SortableGridItem
                    item={item}
                    editing={editing}
                    spaces={spaces}
                    currentSpaceId={currentSpaceId}
                    activeId={activeId}
                    onDeleteApp={(id) => setDeletingAppId(id)}
                    onRenameApp={onRenameApp}
                    onMoveToSpace={onMoveToSpace}
                    onOpenFolder={onOpenFolder}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFolder={(id) => setRenamingFolderId(id)}
                  />
                </div>
              ))}

              {editing && currentPage === totalPages - 1 && (
                <>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); onAddShortcut(null); }}
                    className="flex min-h-[7.6rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] p-2 text-center transition duration-200 hover:bg-white/12 active:scale-[0.98]"
                  >
                    <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] border border-dashed border-white/55 bg-white/15 text-white">
                      <Plus className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-bold text-white">{t('add')}</span>
                  </button>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); onAddFolder(); }}
                    className="flex min-h-[7.6rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] p-2 text-center transition duration-200 hover:bg-white/12 active:scale-[0.98]"
                  >
                    <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] border border-dashed border-white/55 bg-white/15 text-white">
                      <FolderPlus className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-bold text-white">{t('newFolder')}</span>
                  </button>
                </>
              )}

              {Array.from({ length: Math.max(0, pageCapacity - itemsOnPage.length - (editing && currentPage === totalPages - 1 ? 2 : 0)) }).map((_, i) => (
                <div key={`slot-${i}`} aria-hidden="true"
                  style={{ height: 0, minHeight: 0, overflow: 'visible', padding: 0, margin: 0 }} />
              ))}
            </DroppableGrid>
          </SortableContext>
        </div>
      </section>

      {/* Page dots – above dock */}
      {totalPages > 1 && (
        <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full px-3 py-1.5"
          style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <PageDots total={totalPages} current={currentPage} onSelect={goToPage} />
        </div>
      )}

      {selectedFolder && (
        <div className="fixed inset-0 z-[55] grid place-items-center bg-slate-950/22 px-6 backdrop-blur-md"
          role="presentation"
          onPointerDown={(e) => { if (e.target === e.currentTarget) onCloseFolder(); }}
        >
          <section role="dialog" aria-modal="true" aria-label={`${selectedFolder.name} folder`}
            className="w-[min(34rem,calc(100vw-2rem))] rounded-[2.4rem] border border-white/35 bg-white/38 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-6 text-center">
              <h2 className="text-xl font-black tracking-[-0.055em]">{selectedFolder.name}</h2>
              <p className="mt-1 text-sm font-semibold text-white/68">{selectedFolderApps.length} {t('websites')}</p>
            </div>
            <div className="grid grid-cols-4 gap-x-5 gap-y-6 max-sm:grid-cols-3">
              {selectedFolderApps.map((app) => (
                <div key={app.id}
                  className={['relative flex flex-col items-center gap-2 rounded-[1.4rem] p-2', editing ? 'cursor-grab' : ''].join(' ')}
                >
                  <a href={editing ? undefined : app.url} target="_blank" rel="noreferrer"
                    onClick={(e) => { if (editing) e.preventDefault(); }}
                    className="flex flex-col items-center gap-2 rounded-[1.4rem] p-1 transition duration-200 hover:bg-white/12"
                  >
                    <IconWithBadges
                      app={app} editing={editing} spaces={spaces} currentSpaceId={currentSpaceId}
                      onDelete={() => setDeletingAppId(app.id)}
                      onRename={() => onRenameApp(app.id)}
                      onMoveToSpace={(spaceId) => onMoveToSpace(app.id, spaceId)}
                    />
                    <span className="max-w-[5.6rem] truncate text-xs font-bold text-white">{app.name}</span>
                  </a>
                </div>
              ))}
              {editing && (
                <button type="button" onClick={() => onAddShortcut(selectedFolder.id)}
                  className="flex flex-col items-center gap-2 rounded-[1.4rem] p-2 text-center transition duration-200 hover:bg-white/12">
                  <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] border border-dashed border-white/55 bg-white/15 text-white">
                    <Plus className="h-7 w-7" />
                  </span>
                  <span className="text-xs font-bold text-white">{t('add')}</span>
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {renamingFolder && (
        <FolderRenameOverlay name={renamingFolder.name} t={t}
          onSave={(name) => { onRenameFolder(renamingFolder.id, name); setRenamingFolderId(null); }}
          onCancel={() => setRenamingFolderId(null)}
        />
      )}

      {deletingApp && (
        <DeleteConfirmSheet
          title="Delete Shortcut?"
          message={`\u201c${deletingApp.name}\u201d will be removed from your home screen.`}
          onConfirm={() => { onDeleteApp(deletingAppId!); setDeletingAppId(null); }}
          onCancel={() => setDeletingAppId(null)}
        />
      )}
    </main>
  );
}
