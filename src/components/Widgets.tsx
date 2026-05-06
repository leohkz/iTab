import {
  CheckSquare, ChevronDown, ChevronUp, FileText,
  Maximize2, Minimize2, Pause, Pin, PinOff, Play,
  Plus, RotateCcw, Timer, Trash2, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TranslationKey } from '../i18n';
import type { TodoList, WidgetMeta, WidgetState } from '../types';
import { DEFAULT_TODO_LISTS } from '../types';

type WidgetsProps = {
  widgets: WidgetState;
  glass: number;
  t: (key: TranslationKey) => string;
  onChange: (widgets: WidgetState) => void;
};

// ── helpers ──────────────────────────────────────────────────────────
function defaultMeta(): WidgetMeta {
  return { enabled: true, minimised: false, pinned: false, expanded: false };
}

function safeMeta(m: WidgetMeta | undefined): WidgetMeta {
  return m ?? defaultMeta();
}

function safeList(l: TodoList[] | undefined) {
  return (l && l.length > 0) ? l : [...DEFAULT_TODO_LISTS];
}

// ── Pomodoro ring ─────────────────────────────────────────────────────
function PomodoroRing({ progress }: { progress: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" className="-rotate-90" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#0f172a" strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

// ── Floating mini-icon for minimised widgets ──────────────────────────
type MiniIconProps = {
  icon: React.ReactNode;
  label: string;
  glass: number;
  onClick: () => void;
};

function MiniIcon({ icon, label, glass, onClick }: MiniIconProps) {
  const alpha = Math.min(0.72, Math.max(0.55, glass / 120));
  const blur  = Math.round(8 + glass / 9);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expand ${label}`}
      title={`Expand ${label}`}
      className="flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 text-slate-700 shadow-md transition hover:scale-110 active:scale-95"
      style={{
        backgroundColor: `rgba(255,255,255,${alpha})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
      }}
    >
      {icon}
    </button>
  );
}

// ── Widget shell ──────────────────────────────────────────────────────
type WidgetShellProps = {
  label: string;
  icon: React.ReactNode;
  meta: WidgetMeta;
  glass: number;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  onMetaChange: (m: WidgetMeta) => void;
};

function WidgetShell({ label, icon, meta, glass, headerRight, children, onMetaChange }: WidgetShellProps) {
  const shellRef = useRef<HTMLElement>(null);
  const alpha = Math.min(0.72, Math.max(0.55, glass / 120));
  const blur  = Math.round(8 + glass / 9);
  const glassStyle = {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };

  // Close on outside click when not pinned
  useEffect(() => {
    if (meta.pinned || meta.minimised) return;
    const handler = (e: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        onMetaChange({ ...meta, minimised: true });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [meta, onMetaChange]);

  const iconBtn = 'grid h-6 w-6 shrink-0 place-items-center rounded-full transition hover:bg-black/10 text-slate-500 hover:text-slate-800';

  return (
    <section
      ref={shellRef}
      className={[
        'box-border w-full rounded-[1.35rem] border border-black/8 text-slate-800',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.12)]',
        'transition-all duration-200',
        meta.expanded ? 'p-5' : 'p-4',
      ].join(' ')}
      style={glassStyle}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="mr-1 text-slate-400">{icon}</span>
        <p className="flex-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>

        {headerRight}

        {/* Expand / collapse */}
        <button type="button" onClick={() => onMetaChange({ ...meta, expanded: !meta.expanded })} className={iconBtn} aria-label={meta.expanded ? 'Collapse' : 'Expand'}>
          {meta.expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        {/* Pin */}
        <button type="button" onClick={() => onMetaChange({ ...meta, pinned: !meta.pinned })} className={[iconBtn, meta.pinned ? 'text-slate-800' : ''].join(' ')} aria-label={meta.pinned ? 'Unpin' : 'Pin'}>
          {meta.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
        </button>

        {/* Minimise */}
        <button type="button" onClick={() => onMetaChange({ ...meta, minimised: true })} className={iconBtn} aria-label="Minimise">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {children}
    </section>
  );
}

// ── Todo widget ───────────────────────────────────────────────────────
type TodoWidgetProps = { widgets: WidgetState; glass: number; onChange: (w: WidgetState) => void };

function TodoWidget({ widgets, glass, onChange }: TodoWidgetProps) {
  const meta     = safeMeta(widgets.todoMeta);
  const lists    = safeList(widgets.todoLists);
  const activeId = widgets.activeTodoListId ?? 'today';
  const activeTodos = widgets.todos.filter((t) => t.listId === activeId);

  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [newListName, setNewListName]     = useState('');
  const [addingList, setAddingList]       = useState(false);
  const [newListInput, setNewListInput]   = useState('');
  const newTodoRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<WidgetState>) => onChange({ ...widgets, ...patch });
  const setMeta = (m: WidgetMeta) => set({ todoMeta: m });

  const addTodo = (text: string) => {
    if (!text.trim()) return;
    const id = `todo-${Date.now().toString(36)}`;
    set({ todos: [...widgets.todos, { id, text: text.trim(), done: false, listId: activeId }] });
  };

  const toggleDone = (id: string) =>
    set({ todos: widgets.todos.map((t) => t.id === id ? { ...t, done: !t.done } : t) });

  const editText = (id: string, text: string) =>
    set({ todos: widgets.todos.map((t) => t.id === id ? { ...t, text } : t) });

  const deleteTodo = (id: string) =>
    set({ todos: widgets.todos.filter((t) => t.id !== id) });

  const addList = () => {
    if (!newListInput.trim()) { setAddingList(false); return; }
    const id = `list-${Date.now().toString(36)}`;
    set({ todoLists: [...lists, { id, name: newListInput.trim() }], activeTodoListId: id });
    setNewListInput('');
    setAddingList(false);
  };

  const deleteList = (id: string) => {
    const remaining = lists.filter((l) => l.id !== id);
    set({
      todoLists: remaining,
      todos: widgets.todos.filter((t) => t.listId !== id),
      activeTodoListId: activeId === id ? (remaining[0]?.id ?? 'today') : activeId,
    });
  };

  const renameList = (id: string) => {
    set({ todoLists: lists.map((l) => l.id === id ? { ...l, name: newListName } : l) });
    setEditingListId(null);
  };

  const expandedWidth = meta.expanded ? 'w-80' : 'w-64';

  return (
    <div className={expandedWidth}>
      <WidgetShell
        label="To-Do"
        icon={<CheckSquare className="h-3.5 w-3.5" />}
        meta={meta}
        glass={glass}
        onMetaChange={setMeta}
      >
        <div className={['flex gap-3', meta.expanded ? 'flex-row' : 'flex-col'].join(' ')}>

          {/* Sidebar list selector */}
          <div className={['flex shrink-0 flex-col gap-0.5', meta.expanded ? 'w-28' : 'flex-row flex-wrap gap-1'].join(' ')}>
            {lists.map((list) => (
              <div key={list.id} className="group flex items-center gap-1">
                {editingListId === list.id ? (
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onBlur={() => renameList(list.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') renameList(list.id); if (e.key === 'Escape') setEditingListId(null); }}
                    className="flex-1 rounded-lg bg-black/8 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none"
                    style={{ minWidth: 0 }}
                  />
                ) : (
                  <button
                    type="button"
                    onDoubleClick={() => { if (!list.builtIn) { setEditingListId(list.id); setNewListName(list.name); } }}
                    onClick={() => set({ activeTodoListId: list.id })}
                    className={[
                      'flex-1 truncate rounded-lg px-2 py-1 text-left text-xs font-bold transition',
                      activeId === list.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-black/8',
                    ].join(' ')}
                  >
                    {list.name}
                  </button>
                )}
                {!list.builtIn && activeId !== list.id && (
                  <button
                    type="button"
                    onClick={() => deleteList(list.id)}
                    className="hidden shrink-0 text-slate-300 transition hover:text-red-400 group-hover:block"
                    aria-label={`Delete ${list.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {/* + New List */}
            {addingList ? (
              <input
                autoFocus
                value={newListInput}
                onChange={(e) => setNewListInput(e.target.value)}
                onBlur={addList}
                onKeyDown={(e) => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') setAddingList(false); }}
                placeholder="List name…"
                className="rounded-lg bg-black/8 px-2 py-1 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400"
                style={{ minWidth: 0 }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingList(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-black/8 hover:text-slate-600"
              >
                <Plus className="h-3 w-3" />
                New List
              </button>
            )}
          </div>

          {/* Divider (expanded mode) */}
          {meta.expanded && <div className="w-px self-stretch bg-black/8" />}

          {/* Todo items */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
            {activeTodos.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-400">No tasks yet</p>
            )}
            {activeTodos.map((todo) => (
              <div key={todo.id} className="flex w-full items-center gap-2 overflow-hidden rounded-xl bg-black/6 px-2 py-2">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleDone(todo.id)}
                  className="shrink-0 accent-slate-700"
                />
                <input
                  value={todo.text}
                  onChange={(e) => editText(todo.id, e.target.value)}
                  style={{ minWidth: 0 }}
                  className={[
                    'w-full flex-1 bg-transparent text-sm font-bold outline-none',
                    todo.done ? 'text-slate-400 line-through' : 'text-slate-800',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  className="shrink-0 text-slate-400 transition hover:text-slate-700"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* New todo input */}
            <input
              ref={newTodoRef}
              type="text"
              placeholder="+ Add task…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  addTodo(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              style={{ minWidth: 0 }}
              className="box-border w-full rounded-xl bg-black/6 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-black/10"
            />
          </div>
        </div>
      </WidgetShell>
    </div>
  );
}

// ── Pomodoro widget ───────────────────────────────────────────────────
type PomodoroWidgetProps = { widgets: WidgetState; glass: number; onChange: (w: WidgetState) => void };

function PomodoroWidget({ widgets, glass, onChange }: PomodoroWidgetProps) {
  const meta = safeMeta(widgets.pomodoroMeta);
  const set  = (patch: Partial<WidgetState>) => onChange({ ...widgets, ...patch });

  const totalSeconds = widgets.pomodoroMinutes * 60;
  const remaining   = widgets.pomodoroRemainingSeconds;
  const progress    = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isDone      = remaining === 0;
  const timerLabel  = `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-64">
      <WidgetShell
        label="Pomodoro"
        icon={<Timer className="h-3.5 w-3.5" />}
        meta={meta}
        glass={glass}
        onMetaChange={(m) => set({ pomodoroMeta: m })}
      >
        <div className="flex w-full flex-col items-center gap-3">
          <div className="relative">
            <PomodoroRing progress={progress} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isDone
                ? <span className="text-lg">✅</span>
                : <span className="text-sm font-black tabular-nums text-slate-800" data-testid="text-pomodoro-timer">{timerLabel}</span>
              }
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                type="number" min="1" max="90"
                value={widgets.pomodoroMinutes}
                onChange={(e) => {
                  const m = Math.min(90, Math.max(1, Number(e.target.value) || 25));
                  set({ pomodoroMinutes: m, pomodoroRemainingSeconds: m * 60, pomodoroRunning: false });
                }}
                className="w-12 rounded-lg bg-black/8 px-2 py-1 text-sm font-black text-slate-800 outline-none"
                data-testid="input-pomodoro-minutes"
              />
              <span className="text-xs font-bold text-slate-500">min</span>
            </div>
            <div className="flex gap-2">
              {isDone ? (
                <button type="button"
                  onClick={() => set({ pomodoroRemainingSeconds: widgets.pomodoroMinutes * 60, pomodoroRunning: false })}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
                  data-testid="button-pomodoro-reset" aria-label="Reset">
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button type="button"
                  onClick={() => set({ pomodoroRemainingSeconds: remaining || widgets.pomodoroMinutes * 60, pomodoroRunning: !widgets.pomodoroRunning })}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/8 text-slate-700 transition hover:bg-black/14"
                  data-testid="button-pomodoro-toggle" aria-label={widgets.pomodoroRunning ? 'Pause' : 'Start'}>
                  {widgets.pomodoroRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </WidgetShell>
    </div>
  );
}

// ── Quick Note widget ─────────────────────────────────────────────────
type NotesWidgetProps = { widgets: WidgetState; glass: number; onChange: (w: WidgetState) => void };

function NotesWidget({ widgets, glass, onChange }: NotesWidgetProps) {
  const meta = safeMeta(widgets.notesMeta);
  const set  = (patch: Partial<WidgetState>) => onChange({ ...widgets, ...patch });

  return (
    <div className={meta.expanded ? 'w-80' : 'w-64'}>
      <WidgetShell
        label="Quick Note"
        icon={<FileText className="h-3.5 w-3.5" />}
        meta={meta}
        glass={glass}
        headerRight={
          <span className="mr-1 text-[0.65rem] font-bold text-slate-400" aria-live="polite">
            {widgets.notes.length}
          </span>
        }
        onMetaChange={(m) => set({ notesMeta: m })}
      >
        <textarea
          value={widgets.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Quick Note…"
          className={[
            'box-border w-full resize-none rounded-xl bg-black/6 p-3 text-sm font-bold leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:bg-black/10',
            meta.expanded ? 'min-h-36' : 'min-h-20',
          ].join(' ')}
          data-testid="textarea-widget-note"
        />
      </WidgetShell>
    </div>
  );
}

// ── Root Widgets panel ────────────────────────────────────────────────
export function Widgets({ widgets, glass, onChange }: WidgetsProps) {
  const todoMeta     = safeMeta(widgets.todoMeta);
  const pomodoroMeta = safeMeta(widgets.pomodoroMeta);
  const notesMeta    = safeMeta(widgets.notesMeta);

  const alpha = Math.min(0.72, Math.max(0.55, glass / 120));
  const blur  = Math.round(8 + glass / 9);

  return (
    <>
      {/* ── Expanded widgets column ───────────────── */}
      <aside
        className="fixed right-5 top-24 z-20 flex flex-col gap-3 max-xl:hidden"
        aria-label="Widgets"
      >
        {todoMeta.enabled && !todoMeta.minimised && (
          <TodoWidget widgets={widgets} glass={glass} onChange={onChange} />
        )}
        {pomodoroMeta.enabled && !pomodoroMeta.minimised && (
          <PomodoroWidget widgets={widgets} glass={glass} onChange={onChange} />
        )}
        {notesMeta.enabled && !notesMeta.minimised && (
          <NotesWidget widgets={widgets} glass={glass} onChange={onChange} />
        )}
      </aside>

      {/* ── Minimised icons column ────────────────── */}
      <div className="fixed right-5 top-24 z-20 flex flex-col items-end gap-2 max-xl:hidden"
        style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col gap-2" style={{ pointerEvents: 'auto' }}>
          {todoMeta.enabled && todoMeta.minimised && (
            <MiniIcon
              icon={<CheckSquare className="h-4 w-4" />}
              label="To-Do"
              glass={glass}
              onClick={() => onChange({ ...widgets, todoMeta: { ...todoMeta, minimised: false } })}
            />
          )}
          {pomodoroMeta.enabled && pomodoroMeta.minimised && (
            <MiniIcon
              icon={<Timer className="h-4 w-4" />}
              label="Pomodoro"
              glass={glass}
              onClick={() => onChange({ ...widgets, pomodoroMeta: { ...pomodoroMeta, minimised: false } })}
            />
          )}
          {notesMeta.enabled && notesMeta.minimised && (
            <MiniIcon
              icon={<FileText className="h-4 w-4" />}
              label="Quick Note"
              glass={glass}
              onClick={() => onChange({ ...widgets, notesMeta: { ...notesMeta, minimised: false } })}
            />
          )}
        </div>
      </div>
    </>
  );
}
