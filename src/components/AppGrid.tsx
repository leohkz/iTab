import { FolderPlus, Grip, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { AppIcon } from './AppIcon';
import type { AppShortcut, Folder } from '../types';

type AppGridProps = {
  apps: AppShortcut[];
  folders: Folder[];
  editing: boolean;
  selectedFolderId: string | null;
  gridColumns: number;
  gridRows: number;
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
};

type GridItem =
  | { kind: 'app'; id: string; app: AppShortcut }
  | { kind: 'folder'; id: string; folder: Folder; apps: AppShortcut[] };

function FolderPreview({ apps }: { apps: AppShortcut[] }) {
  const previewApps = apps.slice(0, 4);
  return (
    <span className="grid h-[5.4rem] w-[5.4rem] grid-cols-2 grid-rows-2 place-items-center gap-2 rounded-[1.55rem] border border-white/35 bg-white/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_40px_rgba(17,24,39,0.2)] backdrop-blur-sm">
      {Array.from({ length: 4 }).map((_, index) => {
        const app = previewApps[index];
        return app ? (
          <AppIcon key={app.id} app={app} size="mini" />
        ) : (
          <span key={`empty-${index}`} className="h-6 w-6 rounded-[0.48rem] bg-white/22" />
        );
      })}
    </span>
  );
}

function AppEditControls({ onDelete, onRename }: { onDelete: () => void; onRename: () => void }) {
  return (
    <>
      <button
        type="button"
        aria-label="Delete shortcut"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        className="absolute -left-1 -top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
        data-testid="button-delete-shortcut"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Edit shortcut"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}
        className="absolute -right-1 -top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/92 text-slate-950 shadow-lg"
        data-testid="button-rename-shortcut"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </>
  );
}

function FolderRenameOverlay({ name, onSave, onCancel }: { name: string; onSave: (n: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(name);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-72 rounded-2xl bg-white p-6 shadow-2xl">
        <p className="mb-3 text-sm font-black text-slate-700">Rename folder</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(value); if (e.key === 'Escape') onCancel(); }}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">Cancel</button>
          <button type="button" onClick={() => onSave(value)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700">Save</button>
        </div>
      </div>
    </div>
  );
}

export function AppGrid({
  apps, folders, editing, selectedFolderId, gridColumns, gridRows,
  onOpenFolder, onCloseFolder, onStartEditing, onStopEditing,
  onDeleteApp, onRenameApp, onAddShortcut, onAddFolder, onRenameFolder, onDeleteFolder,
  onReorder, onMoveToFolder, onMoveOutOfFolder,
}: AppGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;
  const selectedFolderApps = selectedFolder ? apps.filter((a) => a.folderId === selectedFolder.id) : [];
  const renamingFolder = folders.find((f) => f.id === renamingFolderId) ?? null;
  const mainRef = useRef<HTMLElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editing && e.key === 'Escape') onStopEditing();
  };

  const items = useMemo<GridItem[]>(() => {
    const rootApps = apps.filter((a) => a.folderId === null).map((a) => ({ kind: 'app' as const, id: a.id, app: a }));
    const folderItems = folders.map((folder) => ({
      kind: 'folder' as const, id: folder.id, folder,
      apps: apps.filter((a) => a.folderId === folder.id),
    }));
    return [...rootApps, ...folderItems];
  }, [apps, folders]);

  const gridTemplateColumns = `repeat(${gridColumns}, minmax(5.8rem, 1fr))`;

  const setLongPress = (target: HTMLElement) => {
    const timeout = window.setTimeout(onStartEditing, 520);
    const clear = () => window.clearTimeout(timeout);
    target.addEventListener('pointerup', clear, { once: true });
    target.addEventListener('pointerleave', clear, { once: true });
  };

  return (
    <main
      ref={mainRef}
      className="relative z-10 flex min-h-screen items-center justify-center px-6 pb-32 pt-28"
      data-testid="main-new-tab"
      tabIndex={editing ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => { e.preventDefault(); onStartEditing(); }}
      onClick={(e) => { if (editing && e.target === mainRef.current) onStopEditing(); }}
      onDragOver={(e) => { if (selectedFolderId) e.preventDefault(); }}
      onDrop={() => { if (selectedFolderId && draggedId) onMoveOutOfFolder(draggedId); setDraggedId(null); }}
    >
      {editing && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex justify-center pt-4" aria-live="polite">
          <span className="rounded-full bg-slate-950/60 px-4 py-1.5 text-xs font-bold tracking-wide text-white/80 backdrop-blur-md">
            ✏️ Edit mode — tap blank area or press Esc to exit
          </span>
        </div>
      )}

      <section className="w-full max-w-5xl" aria-label="iPadOS style app grid">
        <div
          className="mx-auto grid gap-x-7 gap-y-8 rounded-[2.3rem] p-6"
          style={{ gridTemplateColumns, maxWidth: `${gridColumns * 7.5}rem`, minHeight: `${gridRows * 7.4}rem` }}
        >
          {items.map((item) => {
            const commonClass = [
              'group relative flex min-h-[7.6rem] flex-col items-center justify-start gap-3 rounded-[1.6rem] p-2 text-center transition duration-200 hover:bg-white/12 active:scale-[0.98]',
              editing ? 'cursor-grab' : '',
              draggedId === item.id ? 'opacity-45' : '',
            ].join(' ');

            if (item.kind === 'folder') {
              return (
                <button
                  key={item.id}
                  type="button"
                  draggable={editing}
                  onDragStart={(e) => { setDraggedId(item.id); e.dataTransfer.setData('text/plain', item.id); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); if (draggedId && draggedId !== item.id) onMoveToFolder(draggedId, item.folder.id); setDraggedId(null); }}
                  onPointerDown={(e) => setLongPress(e.currentTarget)}
                  onClick={(e) => { if (editing) { e.stopPropagation(); return; } onOpenFolder(item.folder.id); }}
                  className={commonClass}
                  data-testid={`button-folder-${item.folder.id}`}
                >
                  {editing && (
                    <>
                      {/* Delete folder */}
                      <button
                        type="button"
                        aria-label="Delete folder"
                        onClick={(e) => { e.stopPropagation(); onDeleteFolder(item.folder.id); }}
                        className="absolute -left-1 -top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      {/* Rename folder */}
                      <button
                        type="button"
                        aria-label="Rename folder"
                        onClick={(e) => { e.stopPropagation(); setRenamingFolderId(item.folder.id); }}
                        className="absolute -right-1 -top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/92 text-slate-950 shadow-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="absolute left-[calc(50%-14px)] top-0 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/30 text-white shadow-lg">
                        <Grip className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </>
                  )}
                  <span className={editing ? 'animate-jiggle' : ''}>
                    <FolderPreview apps={item.apps} />
                  </span>
                  <span className="max-w-[6.4rem] truncate text-sm font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
                    {item.folder.name}
                  </span>
                </button>
              );
            }

            return (
              <a
                key={item.id}
                href={editing ? undefined : item.app.url}
                target="_blank"
                rel="noreferrer"
                draggable={editing}
                onDragStart={(e) => { setDraggedId(item.id); e.dataTransfer.setData('text/plain', item.id); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.stopPropagation(); if (draggedId && draggedId !== item.id) onReorder(draggedId, item.id); setDraggedId(null); }}
                onPointerDown={(e) => setLongPress(e.currentTarget)}
                onClick={(e) => { if (editing) { e.preventDefault(); e.stopPropagation(); } }}
                className={commonClass}
                data-testid={`link-app-${item.app.id}`}
              >
                {editing && <AppEditControls onDelete={() => onDeleteApp(item.app.id)} onRename={() => onRenameApp(item.app.id)} />}
                <span className={editing ? 'animate-jiggle' : ''}>
                  <AppIcon app={item.app} />
                </span>
                <span className="max-w-[6.4rem] truncate text-sm font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
                  {item.app.name}
                </span>
              </a>
            );
          })}

          {editing && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddShortcut(null); }}
                className="flex min-h-[7.6rem] flex-col items-center justify-start gap-3 rounded-[1.6rem] p-2 text-center transition duration-200 hover:bg-white/12 active:scale-[0.98]"
                data-testid="button-add-grid-shortcut"
              >
                <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] border border-dashed border-white/55 bg-white/15 text-white">
                  <Plus className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-white">Add</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddFolder(); }}
                className="flex min-h-[7.6rem] flex-col items-center justify-start gap-3 rounded-[1.6rem] p-2 text-center transition duration-200 hover:bg-white/12 active:scale-[0.98]"
                data-testid="button-add-folder"
              >
                <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] border border-dashed border-white/55 bg-white/15 text-white">
                  <FolderPlus className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-white">New Folder</span>
              </button>
            </>
          )}
        </div>
      </section>

      {selectedFolder && (
        <div
          className="fixed inset-0 z-[55] grid place-items-center bg-slate-950/22 px-6 backdrop-blur-md"
          role="presentation"
          data-testid="modal-folder-backdrop"
          onPointerDown={(e) => { if (e.target === e.currentTarget) onCloseFolder(); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.stopPropagation(); if (draggedId) onMoveOutOfFolder(draggedId); setDraggedId(null); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedFolder.name} folder`}
            className="w-[min(34rem,calc(100vw-2rem))] rounded-[2.4rem] border border-white/35 bg-white/38 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl"
            data-testid="modal-folder"
            onPointerDown={(e) => e.stopPropagation()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.stopPropagation()}
          >
            <div className="mb-6 text-center">
              <h2 className="text-xl font-black tracking-[-0.055em]">{selectedFolder.name}</h2>
              <p className="mt-1 text-sm font-semibold text-white/68">{selectedFolderApps.length} websites</p>
            </div>
            <div className="grid grid-cols-4 gap-x-5 gap-y-6 max-sm:grid-cols-3">
              {selectedFolderApps.map((app) => (
                <a
                  key={app.id}
                  href={editing ? undefined : app.url}
                  target="_blank"
                  rel="noreferrer"
                  draggable={editing}
                  onDragStart={(e) => { setDraggedId(app.id); e.dataTransfer.setData('text/plain', app.id); }}
                  onClick={(e) => { if (editing) e.preventDefault(); }}
                  className={['relative flex flex-col items-center gap-2 rounded-[1.4rem] p-2 text-center transition duration-200 hover:bg-white/12', editing ? 'cursor-grab' : ''].join(' ')}
                  data-testid={`folder-app-${app.id}`}
                >
                  {editing && <AppEditControls onDelete={() => onDeleteApp(app.id)} onRename={() => onRenameApp(app.id)} />}
                  <span className={editing ? 'animate-jiggle' : ''}>
                    <AppIcon app={app} />
                  </span>
                  <span className="max-w-[5.6rem] truncate text-xs font-bold text-white">{app.name}</span>
                </a>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() => onAddShortcut(selectedFolder.id)}
                  className="flex flex-col items-center gap-2 rounded-[1.4rem] p-2 text-center transition duration-200 hover:bg-white/12"
                  data-testid="button-add-folder-shortcut"
                >
                  <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] border border-dashed border-white/55 bg-white/15 text-white">
                    <Plus className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold text-white">Add</span>
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {renamingFolder && (
        <FolderRenameOverlay
          name={renamingFolder.name}
          onSave={(name) => { onRenameFolder(renamingFolder.id, name); setRenamingFolderId(null); }}
          onCancel={() => setRenamingFolderId(null)}
        />
      )}
    </main>
  );
}
