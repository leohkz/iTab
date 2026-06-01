import { FolderPlus, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from './AppIcon';
import type { AppShortcut, Folder, Space } from '../types';
import type { TranslationKey } from '../i18n';

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
  t: (key: TranslationKey) => string;
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
  position: 'absolute',
  zIndex: 20,
  width: BADGE_PX,
  height: BADGE_PX,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(14px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.8)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
  border: '1px solid rgba(255,255,255,0.6)',
};

const removeBadgeStyle: React.CSSProperties = { ...glassBadgeBase, top: BADGE_OFFSET, left: BADGE_OFFSET };
const editBadgeStyle: React.CSSProperties   = { ...glassBadgeBase, top: BADGE_OFFSET, right: BADGE_OFFSET };
const spaceBadgeStyle: React.CSSProperties  = {
  position: 'absolute',
  bottom: BADGE_OFFSET,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 20,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(10px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: 999,
  padding: '1px 6px',
  fontSize: '0.6rem',
  fontWeight: 900,
  color: '#334155',
  boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
};

const svgSize = BADGE_PX * 0.5;

// ─── Delete confirm sheet ────────────────────────────────────────────────────
function DeleteConfirmSheet({ title, message, onConfirm, onCancel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ animation: 'fadeIn 0.15s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xs overflow-hidden rounded-[1.6rem]"
        style={{
          background: 'rgba(255,255,255,0.84)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          border: '1px solid rgba(255,255,255,0.6)',
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

// ─── Folder preview ──────────────────────────────────────────────────────────
function FolderPreview({ apps }: { apps: AppShortcut[] }) {
  const previewApps = apps.slice(0, 4);
  return (
    <span className="grid h-[5.4rem] w-[5.4rem] grid-cols-2 grid-rows-2 place-items-center gap-2 rounded-[1.55rem] border border-white/35 bg-white/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_40px_rgba(17,24,39,0.2)] backdrop-blur-sm">
      {Array.from({ length: 4 }).map((_, index) => {
        const app = previewApps[index];
        return app
          ? <AppIcon key={app.id} app={app} size="mini" />
          : <span key={`empty-${index}`} className="h-6 w-6 rounded-[0.48rem] bg-white/22" />;
      })}
    </span>
  );
}

// ─── Icon with edit badges ───────────────────────────────────────────────────
function IconWithBadges({
  app, editing, spaces, currentSpaceId,
  onDelete, onRename, onMoveToSpace,
  isMini = false,
}: {
  app: AppShortcut;
  editing: boolean;
  spaces: Space[];
  currentSpaceId: string;
  onDelete: () => void;
  onRename: () => void;
  onMoveToSpace: (spaceId: string | undefined) => void;
  isMini?: boolean;
}) {
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);

  return (
    <span
      className={['relative inline-flex', editing ? 'animate-jiggle' : ''].join(' ')}
      style={{ isolation: 'isolate' }}
      data-anim="app-icon"
    >
      <AppIcon app={app} size={isMini ? 'grid' : 'grid'} />
      {editing && (
        <>
          <button type="button" aria-label="Delete shortcut"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            style={removeBadgeStyle}
          >
            <Minus style={{ width: svgSize, height: svgSize, color: '#ef4444', strokeWidth: 3 }} />
          </button>
          <button type="button" aria-label="Edit shortcut"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}
            style={editBadgeStyle}
          >
            <Pencil style={{ width: svgSize * 0.9, height: svgSize * 0.9, color: '#334155', strokeWidth: 2 }} />
          </button>
          <button type="button" aria-label="Move to space"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSpaceMenuOpen((v) => !v); }}
            style={spaceBadgeStyle}
          >
            {app.spaceId ? (spaces.find((s) => s.id === app.spaceId)?.name ?? app.spaceId) : '\u2736 All'}
          </button>
          {spaceMenuOpen && (
            <div
              className="absolute z-30 overflow-hidden rounded-2xl shadow-2xl"
              style={{
                bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-[9rem] py-1 text-xs font-black text-slate-800">
                <button type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-white/50"
                  onClick={(e) => { e.stopPropagation(); onMoveToSpace(undefined); setSpaceMenuOpen(false); }}
                >
                  <span className="text-slate-400">\u2736</span> All Spaces
                </button>
                {spaces.map((space) => (
                  <button key={space.id} type="button"
                    className={['flex w-full items-center gap-2 px-3 py-2 hover:bg-white/50',
                      space.id === currentSpaceId ? 'text-slate-950' : 'text-slate-600'].join(' ')}
                    onClick={(e) => { e.stopPropagation(); onMoveToSpace(space.id); setSpaceMenuOpen(false); }}
                  >
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

// ─── Folder rename overlay ───────────────────────────────────────────────────
function FolderRenameOverlay({ name, onSave, onCancel, t }: {
  name: string; onSave: (n: string) => void; onCancel: () => void; t: (key: TranslationKey) => string;
}) {
  const [value, setValue] = useState(name);
  const handleSave = () => { if (!value.trim()) return; onSave(value.trim()); };
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-72 rounded-2xl bg-white p-6 shadow-2xl">
        <p className="mb-3 text-sm font-black text-slate-700">{t('renameFolder')}</p>
        <input
          autoFocus value={value}
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

// ─── Page dots ───────────────────────────────────────────────────────────────
function PageDots({
  total, current, onSelect,
}: { total: number; current: number; onSelect: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-[7px]">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Page ${i + 1}`}
          onClick={() => onSelect(i)}
          className="transition-all"
          style={{
            width: i === current ? 8 : 7,
            height: i === current ? 8 : 7,
            borderRadius: '50%',
            background: i === current ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.35)',
            boxShadow: i === current ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main AppGrid ─────────────────────────────────────────────────────────────
export function AppGrid({
  apps, folders, editing, selectedFolderId, gridColumns, gridRows,
  currentSpaceId, spaces, spaceDirection, t,
  onOpenFolder, onCloseFolder, onStartEditing, onStopEditing,
  onDeleteApp, onRenameApp, onAddShortcut, onAddFolder, onRenameFolder, onDeleteFolder,
  onReorder, onMoveToFolder, onMoveOutOfFolder, onMoveToSpace,
}: AppGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);
  const [dragOverPageEdge, setDragOverPageEdge] = useState<'left' | 'right' | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const edgeDragTimerRef = useRef<number | null>(null);

  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;
  const selectedFolderApps = selectedFolder ? apps.filter((a) => a.folderId === selectedFolder.id) : [];
  const renamingFolder = folders.find((f) => f.id === renamingFolderId) ?? null;
  const deletingApp = apps.find((a) => a.id === deletingAppId) ?? null;

  const pageCapacity = gridColumns * gridRows;

  const items = useMemo<GridItem[]>(() => {
    const rootApps = apps
      .filter((a) => a.folderId === null || a.folderId === undefined)
      .map((a) => ({ kind: 'app' as const, id: a.id, app: a }));
    const folderItems = folders.map((folder) => ({
      kind: 'folder' as const, id: folder.id, folder,
      apps: apps.filter((a) => a.folderId === folder.id),
    }));
    return [...rootApps, ...folderItems];
  }, [apps, folders]);

  const realPageCount = Math.max(1, Math.ceil(items.length / pageCapacity));
  const totalPages = editing ? realPageCount + 1 : realPageCount;

  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
  }, [totalPages, currentPage]);

  // Reset page when space changes
  useEffect(() => { setCurrentPage(0); }, [currentSpaceId]);

  const itemsOnPage = useMemo(() => {
    const start = currentPage * pageCapacity;
    return items.slice(start, start + pageCapacity);
  }, [items, currentPage, pageCapacity]);

  const goToPage = useCallback((page: number) => {
    if (page === currentPage || animating) return;
    const dir = page > currentPage ? 'left' : 'right';
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      setSlideDir(null);
      setAnimating(false);
    }, 320);
  }, [currentPage, animating]);

  const goNext = useCallback(() => { if (currentPage < totalPages - 1) goToPage(currentPage + 1); }, [currentPage, totalPages, goToPage]);
  const goPrev = useCallback(() => { if (currentPage > 0) goToPage(currentPage - 1); }, [currentPage, goToPage]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target instanceof Element && e.target.closest('a,button,input')) return;
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    const dy = e.clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const handleDragOverMain = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    const edgeZone = rect.width * 0.12;
    const x = e.clientX - rect.left;
    if (x < edgeZone) {
      setDragOverPageEdge('left');
      if (!edgeDragTimerRef.current) {
        edgeDragTimerRef.current = window.setTimeout(() => { goPrev(); edgeDragTimerRef.current = null; }, 700);
      }
    } else if (x > rect.width - edgeZone) {
      setDragOverPageEdge('right');
      if (!edgeDragTimerRef.current) {
        edgeDragTimerRef.current = window.setTimeout(() => { goNext(); edgeDragTimerRef.current = null; }, 700);
      }
    } else {
      setDragOverPageEdge(null);
      if (edgeDragTimerRef.current) { clearTimeout(edgeDragTimerRef.current); edgeDragTimerRef.current = null; }
    }
  };

  const handleDragLeaveMain = () => {
    setDragOverPageEdge(null);
    if (edgeDragTimerRef.current) { clearTimeout(edgeDragTimerRef.current); edgeDragTimerRef.current = null; }
  };

  const gridTemplateColumns = `repeat(${gridColumns}, minmax(5.8rem, 1fr))`;

  const setLongPress = (target: HTMLElement) => {
    const timeout = window.setTimeout(onStartEditing, 520);
    const clear = () => window.clearTimeout(timeout);
    target.addEventListener('pointerup', clear, { once: true });
    target.addEventListener('pointerleave', clear, { once: true });
  };

  // Drop on empty page: move dragged item to end of list, then jump to its new page
  const handleDropOnEmptyPage = (e: React.DragEvent) => {
    e.stopPropagation();
    if (!draggedId) return;
    const otherItems = items.filter((it) => it.id !== draggedId);
    const lastItem = otherItems[otherItems.length - 1];
    if (lastItem) {
      onReorder(draggedId, lastItem.id);
    }
    // After reorder, item lands at end → new realPageCount = ceil((items.length)/pageCapacity)
    // Navigate to the last real page
    const newRealPageCount = Math.max(1, Math.ceil(items.length / pageCapacity));
    const targetPage = newRealPageCount - 1;
    setTimeout(() => setCurrentPage(targetPage), 50);
    setDraggedId(null);
  };

  let pageSlideStyle: React.CSSProperties;
  if (animating && slideDir) {
    pageSlideStyle = {
      transform: slideDir === 'left' ? 'translateX(-6%)' : 'translateX(6%)',
      opacity: 0,
      transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s',
    };
  } else {
    pageSlideStyle = {
      transform: 'translateX(0)',
      opacity: 1,
      transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s',
    };
  }

  const spaceAnimStyle: React.CSSProperties = spaceDirection ? {
    animation: spaceDirection === 'right'
      ? 'spaceSlideFromRight 0.32s cubic-bezier(0.4,0,0.2,1) both'
      : 'spaceSlideFromLeft 0.32s cubic-bezier(0.4,0,0.2,1) both',
  } : {};

  const cellClass = [
    'group relative flex min-h-[7.6rem] flex-col items-center justify-center gap-3 rounded-[1.6rem] p-2',
    editing ? 'cursor-grab' : '',
  ].join(' ');

  const isEmptyPage = editing && currentPage === realPageCount;

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
      onDragOver={handleDragOverMain}
      onDragLeave={handleDragLeaveMain}
      onDrop={() => {
        if (selectedFolderId && draggedId) onMoveOutOfFolder(draggedId);
        setDraggedId(null);
        setDragOverPageEdge(null);
        if (edgeDragTimerRef.current) { clearTimeout(edgeDragTimerRef.current); edgeDragTimerRef.current = null; }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <style>{`
        @keyframes spaceSlideFromRight {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spaceSlideFromLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {editing && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex justify-center pt-4" aria-live="polite">
          <span className="rounded-full bg-slate-950/60 px-4 py-1.5 text-xs font-bold tracking-wide text-white/80 backdrop-blur-md">
            \u270f\ufe0f {t('editModeHint')}
          </span>
        </div>
      )}

      {dragOverPageEdge === 'left' && currentPage > 0 && (
        <div className="pointer-events-none fixed left-0 top-0 z-50 h-full w-16 bg-gradient-to-r from-white/20 to-transparent" />
      )}
      {dragOverPageEdge === 'right' && currentPage < totalPages - 1 && (
        <div className="pointer-events-none fixed right-0 top-0 z-50 h-full w-16 bg-gradient-to-l from-white/20 to-transparent" />
      )}

      <section
        key={currentSpaceId}
        className="w-full max-w-5xl"
        aria-label="App grid"
        style={spaceAnimStyle}
      >
        <div style={pageSlideStyle}>
          {isEmptyPage ? (
            <div
              className="mx-auto flex items-center justify-center rounded-[2.3rem] border-2 border-dashed border-white/25"
              style={{ maxWidth: `${gridColumns * 7.5}rem`, minHeight: `${gridRows * 7.4}rem` }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnEmptyPage}
            >
              <p className="text-sm font-bold text-white/30">Drag apps here to add a new page</p>
            </div>
          ) : (
            <div
              className="mx-auto grid gap-x-7 gap-y-8 rounded-[2.3rem] p-6"
              style={{ gridTemplateColumns, maxWidth: `${gridColumns * 7.5}rem`, minHeight: `${gridRows * 7.4}rem` }}
            >
              {itemsOnPage.map((item) => {
                if (item.kind === 'folder') {
                  return (
                    <div
                      key={item.id}
                      className={[cellClass, draggedId === item.id ? 'opacity-45' : ''].join(' ')}
                      draggable={editing}
                      onDragStart={(e) => { setDraggedId(item.id); e.dataTransfer.setData('text/plain', item.id); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.stopPropagation(); if (draggedId && draggedId !== item.id) onMoveToFolder(draggedId, item.folder.id); setDraggedId(null); }}
                      onPointerDown={(e) => setLongPress(e.currentTarget)}
                      data-anim="app-icon"
                    >
                      <button
                        type="button"
                        onClick={(e) => { if (editing) { e.stopPropagation(); return; } onOpenFolder(item.folder.id); }}
                        className="flex flex-col items-center gap-2 rounded-[1.6rem] p-2 transition duration-200 hover:bg-white/12 active:scale-[0.98]"
                      >
                        <span className={['relative inline-flex', editing ? 'animate-jiggle' : ''].join(' ')} style={{ isolation: 'isolate' }}>
                          <FolderPreview apps={item.apps} />
                          {editing && (
                            <>
                              <button type="button" aria-label="Delete folder"
                                onClick={(e) => { e.stopPropagation(); onDeleteFolder(item.folder.id); }}
                                style={{ ...removeBadgeStyle, top: BADGE_OFFSET + 4, left: BADGE_OFFSET + 4 }}
                              >
                                <Trash2 style={{ width: svgSize, height: svgSize, color: '#ef4444', strokeWidth: 2.5 }} />
                              </button>
                              <button type="button" aria-label="Rename folder"
                                onClick={(e) => { e.stopPropagation(); setRenamingFolderId(item.folder.id); }}
                                style={{ ...editBadgeStyle, top: BADGE_OFFSET + 4, right: BADGE_OFFSET + 4 }}
                              >
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
                  <div
                    key={item.id}
                    className={[cellClass, draggedId === item.id ? 'opacity-45' : ''].join(' ')}
                    draggable={editing}
                    onDragStart={(e) => { setDraggedId(item.id); e.dataTransfer.setData('text/plain', item.id); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.stopPropagation(); if (draggedId && draggedId !== item.id) onReorder(draggedId, item.id); setDraggedId(null); }}
                    onPointerDown={(e) => setLongPress(e.currentTarget)}
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
                        onDelete={() => setDeletingAppId(item.app.id)}
                        onRename={() => onRenameApp(item.app.id)}
                        onMoveToSpace={(spaceId) => onMoveToSpace(item.app.id, spaceId)}
                      />
                      <span className="max-w-[6.4rem] truncate text-sm font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
                        {item.app.name}
                      </span>
                    </a>
                  </div>
                );
              })}

              {editing && currentPage === realPageCount - 1 && (
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
            </div>
          )}
        </div>
      </section>

      {totalPages > 1 && (
        <div
          className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full px-3 py-1.5"
          style={{
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(12px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <PageDots total={totalPages} current={currentPage} onSelect={goToPage} />
        </div>
      )}

      {selectedFolder && (
        <div
          className="fixed inset-0 z-[55] grid place-items-center bg-slate-950/22 px-6 backdrop-blur-md"
          role="presentation"
          onPointerDown={(e) => { if (e.target === e.currentTarget) onCloseFolder(); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.stopPropagation(); if (draggedId) onMoveOutOfFolder(draggedId); setDraggedId(null); }}
        >
          <section
            role="dialog" aria-modal="true" aria-label={`${selectedFolder.name} folder`}
            className="w-[min(34rem,calc(100vw-2rem))] rounded-[2.4rem] border border-white/35 bg-white/38 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl"
            onPointerDown={(e) => e.stopPropagation()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.stopPropagation()}
          >
            <div className="mb-6 text-center">
              <h2 className="text-xl font-black tracking-[-0.055em]">{selectedFolder.name}</h2>
              <p className="mt-1 text-sm font-semibold text-white/68">{selectedFolderApps.length} {t('websites')}</p>
            </div>
            <div className="grid grid-cols-4 gap-x-5 gap-y-6 max-sm:grid-cols-3">
              {selectedFolderApps.map((app) => (
                <div
                  key={app.id}
                  className={['relative flex flex-col items-center gap-2 rounded-[1.4rem] p-2', editing ? 'cursor-grab' : ''].join(' ')}
                  draggable={editing}
                  onDragStart={(e) => { setDraggedId(app.id); e.dataTransfer.setData('text/plain', app.id); }}
                >
                  <a
                    href={editing ? undefined : app.url}
                    target="_blank" rel="noreferrer"
                    onClick={(e) => { if (editing) e.preventDefault(); }}
                    className="flex flex-col items-center gap-2 rounded-[1.4rem] p-1 transition duration-200 hover:bg-white/12"
                  >
                    <IconWithBadges
                      app={app} editing={editing} spaces={spaces} currentSpaceId={currentSpaceId}
                      onDelete={() => setDeletingAppId(app.id)}
                      onRename={() => onRenameApp(app.id)}
                      onMoveToSpace={(spaceId) => onMoveToSpace(app.id, spaceId)}
                      isMini
                    />
                    <span className="max-w-[5.6rem] truncate text-xs font-bold text-white">{app.name}</span>
                  </a>
                </div>
              ))}
              {editing && (
                <button type="button"
                  onClick={() => onAddShortcut(selectedFolder.id)}
                  className="flex flex-col items-center gap-2 rounded-[1.4rem] p-2 text-center transition duration-200 hover:bg-white/12"
                >
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
        <FolderRenameOverlay
          name={renamingFolder.name} t={t}
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
