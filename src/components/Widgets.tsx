import {
  CalendarDays, CheckSquare, ChevronDown, FileText,
  Focus, Minimize2, Pause, Pin, PinOff, Play,
  Plus, RotateCcw, Timer, Trash2, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TranslationKey } from '../i18n';
import type { TodoItem, TodoList, WidgetMeta, WidgetState } from '../types';
import { DEFAULT_TODO_LISTS } from '../types';
import { FocusSoundPanel, defaultFocusSoundState } from './FocusSound';
import type { FocusSoundState } from './FocusSound';

type WidgetsProps = {
  widgets: WidgetState;
  glass: number;
  t: (key: TranslationKey) => string;
  onChange: (widgets: WidgetState) => void;
};

type Locale = 'en' | 'zh';

function detectLocale(): Locale {
  const lang = navigator.language ?? '';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

const LABELS: Record<string, Record<Locale, string>> = {
  today:     { en: 'Today',     zh: '今日' },
  upcoming:  { en: 'Upcoming',  zh: '即將' },
  inbox:     { en: 'Inbox',     zh: '收件笱' },
  completed: { en: 'Completed', zh: '已完成' },
  noTasks:   { en: 'No tasks',  zh: '暫無任務' },
  addTask:   { en: '+ Add task…', zh: '+ 新增任務…' },
  listName:  { en: 'List name…', zh: '清單名稱…' },
  setDate:   { en: 'Set date', zh: '設定日期' },
  clearDate: { en: 'Clear', zh: '清除' },
};

function lb(key: string, locale: Locale): string {
  return LABELS[key]?.[locale] ?? LABELS[key]?.['en'] ?? key;
}

function getBuiltInLabel(id: string, locale: Locale): string {
  return lb(id, locale);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateSlot(dueDate?: string): 'today' | 'upcoming' | 'other' {
  if (!dueDate) return 'other';
  const d = dueDate.slice(0, 10);
  const today = todayStr();
  if (d === today) return 'today';
  if (d > today) return 'upcoming';
  return 'today';
}

function formatDate(dueDate: string, locale: Locale): string {
  const d = new Date(dueDate + 'T00:00');
  return d.toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-GB', { month: 'short', day: 'numeric' });
}

function defaultMeta(): WidgetMeta {
  return { enabled: true, minimised: false, pinned: false, expanded: false };
}

function safeMeta(m: WidgetMeta | undefined): WidgetMeta {
  return m ?? defaultMeta();
}

function safeList(l: TodoList[] | undefined) {
  return (l && l.length > 0) ? l : [...DEFAULT_TODO_LISTS];
}

function glassStyle(glass: number) {
  const alpha = Math.min(0.72, Math.max(0.55, glass / 120));
  const blur  = Math.round(8 + glass / 9);
  return {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };
}

// ── Pomodoro gauge dial (widget, open-bottom arc 240°) ──────────────────
// Fix: clip the SVG container to SIZE×SIZE so the arc doesn't overflow into
// the minute-input row below it.
function PomodoroGaugeDial({ progress, isBreak, timerLabel, isDone }: {
  progress: number;
  isBreak: boolean;
  timerLabel: string;
  isDone: boolean;
}) {
  const SIZE = 160;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 62;
  const STROKE = 10;
  const GAP_DEG = 120;   // degrees hidden at the bottom
  const ARC_DEG = 240;   // 360 - 120
  const startDeg = 150;  // bottom-left (150° from 12-o'clock)
  const endDeg = startDeg + ARC_DEG; // 390° == 30°

  const degToRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const polarToXY = (deg: number, r: number) => ({
    x: cx + r * Math.cos(degToRad(deg)),
    y: cy + r * Math.sin(degToRad(deg)),
  });
  const arcPath = (s: number, e: number, r: number, large: boolean) => {
    const sp = polarToXY(s, r);
    const ep = polarToXY(e, r);
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${large ? 1 : 0} 1 ${ep.x} ${ep.y}`;
  };

  const trackPath = arcPath(startDeg, endDeg, R, true);
  const progressDeg = startDeg + ARC_DEG * progress;
  const progressLarge = ARC_DEG * progress > 180;
  const progressPath = progress > 0 ? arcPath(startDeg, progressDeg, R, progressLarge) : null;
  const activeColor = isBreak ? '#34d399' : '#0f172a';

  // The visible area we want: top half + a bit below centre (cuts the gap cleanly).
  // HEIGHT = SIZE * 0.78 hides the bottom open gap.
  const HEIGHT = Math.round(SIZE * 0.78);

  return (
    <div style={{ position: 'relative', width: SIZE, height: HEIGHT, overflow: 'hidden' }}>
      <svg
        width={SIZE} height={SIZE}
        style={{ position: 'absolute', top: 0, left: 0 }}
        aria-hidden="true"
      >
        <path d={trackPath} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={STROKE} strokeLinecap="round" />
        {progressPath && (
          <path
            d={progressPath} fill="none"
            stroke={activeColor} strokeWidth={STROKE} strokeLinecap="round"
            style={{ transition: 'all 1s linear' }}
          />
        )}
      </svg>
      {/* Timer label centred inside the arc */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingBottom: 8,
      }}>
        {isDone
          ? <span style={{ fontSize: '1.5rem' }}>✅</span>
          : <span
              style={{ fontSize: '1.125rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#1e293b' }}
              data-testid="text-pomodoro-timer"
            >{timerLabel}</span>
        }
      </div>
    </div>
  );
}

// ── Car gauge dial (Focus Mode overlay — unchanged) ────────────────────
function GaugeDial({ progress, isBreak }: { progress: number; isBreak: boolean }) {
  const SIZE = 260;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 108;
  const STROKE = 16;
  const GAP_DEG = 120;
  const ARC_DEG = 360 - GAP_DEG;
  const startDeg = 150;
  const endDeg   = startDeg + ARC_DEG;

  const degToRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const polarToXY = (deg: number, r: number) => ({
    x: cx + r * Math.cos(degToRad(deg)),
    y: cy + r * Math.sin(degToRad(deg)),
  });
  const arcPath = (startD: number, endD: number, r: number, large: boolean) => {
    const s = polarToXY(startD, r);
    const e = polarToXY(endD, r);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large ? 1 : 0} 1 ${e.x} ${e.y}`;
  };

  const trackPath = arcPath(startDeg, endDeg, R, true);
  const progressDeg = startDeg + ARC_DEG * progress;
  const progressLarge = ARC_DEG * progress > 180;
  const progressPath = progress > 0 ? arcPath(startDeg, progressDeg, R, progressLarge) : null;
  const activeColor = isBreak ? '#34d399' : '#ffffff';

  return (
    <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }} aria-hidden="true">
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={STROKE} strokeLinecap="round" />
      {progressPath && (
        <path
          d={progressPath} fill="none"
          stroke={activeColor} strokeWidth={STROKE} strokeLinecap="round"
          style={{ transition: 'all 1s linear', filter: `drop-shadow(0 0 6px ${activeColor}88)` }}
        />
      )}
      {[startDeg, endDeg].map((deg, i) => {
        const inner = polarToXY(deg, R - STROKE / 2 - 2);
        const outer = polarToXY(deg, R + STROKE / 2 + 2);
        return (
          <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

// ── Mini icon button ──────────────────────────────────────────────────
type MiniIconProps = { icon: React.ReactNode; label: string; onClick: () => void };

export function MiniIcon({ icon, label, onClick }: MiniIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expand ${label}`}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/18 hover:text-white"
    >
      {icon}
    </button>
  );
}

// ── Apple-style date picker popover ──────────────────────────────────
function DatePicker({
  value, locale, onConfirm, onClear, onClose,
}: {
  value?: string;
  locale: Locale;
  onConfirm: (d: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(value ?? todayStr());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-56 rounded-2xl border border-white/30 shadow-2xl"
      style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="text-center text-xs font-black uppercase tracking-widest text-slate-500">{lb('setDate', locale)}</p>
        <input
          type="date"
          value={selected}
          min={todayStr()}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400 focus:bg-white/80"
        />
        <div className="flex gap-2">
          {value && (
            <button type="button" onClick={onClear} className="flex-1 rounded-xl border border-black/10 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-black/6 hover:text-slate-600">
              {lb('clearDate', locale)}
            </button>
          )}
          <button type="button" onClick={() => { onConfirm(selected); onClose(); }} className="flex-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700">
            OK
          </button>
        </div>
      </div>
    </div>
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
  hideExpand?: boolean;
};

function WidgetShell({ label, icon, meta, glass: g, headerRight, children, onMetaChange, hideExpand }: WidgetShellProps) {
  const shellRef = useRef<HTMLElement>(null);

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
      style={glassStyle(g)}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="mr-1 text-slate-400">{icon}</span>
        <p className="flex-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        {headerRight}
        {!hideExpand && (
          <button type="button" onClick={() => onMetaChange({ ...meta, expanded: !meta.expanded })} className={iconBtn} aria-label={meta.expanded ? 'Collapse' : 'Expand'}>
            {meta.expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5 rotate-180" />}
          </button>
        )}
        <button type="button" onClick={() => onMetaChange({ ...meta, pinned: !meta.pinned })} className={[iconBtn, meta.pinned ? 'text-slate-800' : ''].join(' ')} aria-label={meta.pinned ? 'Unpin' : 'Pin'}>
          {meta.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => onMetaChange({ ...meta, minimised: true })} className={iconBtn} aria-label="Minimise">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </section>
  );
}

// ── TodoItem row ──────────────────────────────────────────────────────
function TodoRow({
  todo, locale, isCompleted, onToggle, onEdit, onDelete, onDateChange,
}: {
  todo: TodoItem; locale: Locale; isCompleted: boolean;
  onToggle: () => void; onEdit: (text: string) => void;
  onDelete: () => void; onDateChange: (d: string | undefined) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const dateDisplay = todo.dueDate ? formatDate(todo.dueDate, locale) : null;

  return (
    <div className="group relative flex w-full flex-col gap-1 overflow-visible rounded-xl bg-black/6 px-2 py-2">
      {/* Single row: checkbox | text | [date label] | 📅 icon | 🗑 icon */}
      <div className="flex w-full items-center gap-2">
        <input type="checkbox" checked={todo.done} onChange={onToggle} className="shrink-0 accent-slate-700" />
        <input
          value={todo.text}
          onChange={(e) => onEdit(e.target.value)}
          style={{ minWidth: 0 }}
          className={['w-full flex-1 bg-transparent text-sm font-bold outline-none', (todo.done || isCompleted) ? 'text-slate-400 line-through' : 'text-slate-800'].join(' ')}
        />
        {/* Date label — shown left of calendar icon in the same row */}
        {dateDisplay && !showPicker && (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="shrink-0 rounded-full bg-black/8 px-2 py-0.5 text-[0.65rem] font-bold text-slate-500 transition hover:bg-black/12 whitespace-nowrap"
          >
            {dateDisplay}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className={['shrink-0 transition', todo.dueDate ? 'text-slate-600' : 'text-slate-400 hover:text-slate-600'].join(' ')}
          aria-label={lb('setDate', locale)}
          title={lb('setDate', locale)}
        >
          <CalendarDays className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} className="shrink-0 text-slate-500 transition hover:text-red-500" aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {showPicker && (
        <DatePicker
          value={todo.dueDate} locale={locale}
          onConfirm={(d) => onDateChange(d)}
          onClear={() => { onDateChange(undefined); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ── Todo widget ───────────────────────────────────────────────────────
type TodoWidgetProps = { widgets: WidgetState; glass: number; onChange: (w: WidgetState) => void };

function TodoWidget({ widgets, glass, onChange }: TodoWidgetProps) {
  const locale: Locale = detectLocale();
  const meta     = safeMeta(widgets.todoMeta);
  const lists    = safeList(widgets.todoLists);
  const activeId = widgets.activeTodoListId ?? 'today';

  const [editingListId, setEditingListId]       = useState<string | null>(null);
  const [newListName, setNewListName]           = useState('');
  const [addingList, setAddingList]             = useState(false);
  const [newListInput, setNewListInput]         = useState('');
  const [confirmDeleteId, setConfirmDeleteId]   = useState<string | null>(null);
  const newTodoRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<WidgetState>) => onChange({ ...widgets, ...patch });
  const setMeta = (m: WidgetMeta) => set({ todoMeta: m });

  const getDisplayTodos = (listId: string): TodoItem[] => {
    if (listId === 'completed') return widgets.todos.filter((t) => t.done);
    if (listId === 'today') return widgets.todos.filter((t) => !t.done && (
      t.listId === 'today' || (t.dueDate && dueDateSlot(t.dueDate) === 'today' && t.listId !== 'upcoming')
    ));
    if (listId === 'upcoming') return widgets.todos.filter((t) => !t.done && (
      t.listId === 'upcoming' || (t.dueDate && dueDateSlot(t.dueDate) === 'upcoming' && t.listId !== 'today')
    ));
    return widgets.todos.filter((t) => !t.done && t.listId === listId);
  };

  const activeTodos = getDisplayTodos(activeId);

  const addTodo = (text: string) => {
    if (!text.trim()) return;
    const id = `todo-${Date.now().toString(36)}`;
    const targetList = activeId === 'completed' ? 'inbox' : activeId;
    set({ todos: [...widgets.todos, { id, text: text.trim(), done: false, listId: targetList }] });
  };

  const toggleDone  = (id: string) => set({ todos: widgets.todos.map((t) => t.id === id ? { ...t, done: !t.done } : t) });
  const editText    = (id: string, text: string) => set({ todos: widgets.todos.map((t) => t.id === id ? { ...t, text } : t) });
  const deleteTodo  = (id: string) => set({ todos: widgets.todos.filter((t) => t.id !== id) });
  const setDueDate  = (id: string, dueDate: string | undefined) => set({ todos: widgets.todos.map((t) => t.id === id ? { ...t, dueDate } : t) });

  const addList = () => {
    if (!newListInput.trim()) { setAddingList(false); return; }
    const id = `list-${Date.now().toString(36)}`;
    set({ todoLists: [...lists, { id, name: newListInput.trim() }], activeTodoListId: id });
    setNewListInput(''); setAddingList(false);
  };

  const deleteList = (id: string) => {
    const remaining = lists.filter((l) => l.id !== id);
    const updatedTodos = widgets.todos.map((t) => t.listId === id ? { ...t, listId: 'inbox' } : t);
    set({ todoLists: remaining, todos: updatedTodos, activeTodoListId: activeId === id ? (remaining[0]?.id ?? 'inbox') : activeId });
    setConfirmDeleteId(null);
  };

  const renameList = (id: string) => {
    set({ todoLists: lists.map((l) => l.id === id ? { ...l, name: newListName } : l) });
    setEditingListId(null);
  };

  const listLabel = (list: TodoList) => list.builtIn ? getBuiltInLabel(list.id, locale) : list.name;
  const panelW = meta.expanded ? 'w-[40rem]' : 'w-72';

  return (
    <div className={panelW}>
      <WidgetShell label={locale === 'zh' ? '待辦事項' : 'To-Do'} icon={<CheckSquare className="h-3.5 w-3.5" />} meta={meta} glass={glass} onMetaChange={setMeta}>
        <div className={['flex gap-3', meta.expanded ? 'flex-row' : 'flex-col'].join(' ')}>
          <div className={['flex shrink-0 flex-col gap-0.5', meta.expanded ? 'w-36' : 'flex-row flex-wrap gap-1'].join(' ')}>
            {lists.map((list) => (
              <div key={list.id} className="group/list flex items-center gap-1">
                {editingListId === list.id ? (
                  <input autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)} onBlur={() => renameList(list.id)} onKeyDown={(e) => { if (e.key === 'Enter') renameList(list.id); if (e.key === 'Escape') setEditingListId(null); }} className="flex-1 rounded-lg bg-black/8 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none" style={{ minWidth: 0 }} />
                ) : (
                  <>
                    <button type="button" onDoubleClick={() => { if (!list.builtIn) { setEditingListId(list.id); setNewListName(list.name); } }} onClick={() => set({ activeTodoListId: list.id })} className={['flex-1 truncate rounded-lg px-2 py-1 text-left text-xs font-bold transition', activeId === list.id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-black/8'].join(' ')}>
                      {listLabel(list)}
                    </button>
                    {!list.builtIn && (
                      confirmDeleteId === list.id ? (
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => deleteList(list.id)} className="rounded px-1 text-[0.6rem] font-black text-red-500 hover:bg-red-50">✓</button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded px-1 text-[0.6rem] font-black text-slate-400 hover:bg-black/8">✕</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmDeleteId(list.id)} className="hidden shrink-0 text-slate-400 transition hover:text-red-400 group-hover/list:flex" aria-label={`Delete ${list.name}`}>
                          <X className="h-3 w-3" />
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            ))}
            {addingList ? (
              <input autoFocus value={newListInput} onChange={(e) => setNewListInput(e.target.value)} onBlur={addList} onKeyDown={(e) => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') setAddingList(false); }} placeholder={lb('listName', locale)} className="rounded-lg bg-black/8 px-2 py-1 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400" style={{ minWidth: 0 }} />
            ) : (
              <button type="button" onClick={() => setAddingList(true)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-black/8 hover:text-slate-600">
                <Plus className="h-3 w-3" />{locale === 'zh' ? '新清單' : 'New List'}
              </button>
            )}
          </div>
          {meta.expanded && <div className="w-px self-stretch bg-black/8" />}
          <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-visible">
            {activeTodos.length === 0 && <p className="py-2 text-center text-xs text-slate-400">{lb('noTasks', locale)}</p>}
            {activeTodos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} locale={locale} isCompleted={activeId === 'completed'} onToggle={() => toggleDone(todo.id)} onEdit={(text) => editText(todo.id, text)} onDelete={() => deleteTodo(todo.id)} onDateChange={(d) => setDueDate(todo.id, d)} />
            ))}
            {activeId !== 'completed' && (
              <input ref={newTodoRef} type="text" placeholder={lb('addTask', locale)} onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addTodo(e.currentTarget.value); e.currentTarget.value = ''; } }} style={{ minWidth: 0 }} className="box-border w-full rounded-xl bg-black/6 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-black/10" />
            )}
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
  const locale: Locale = detectLocale();

  const isBreak = widgets.pomodoroIsBreak ?? false;
  const totalSeconds = isBreak
    ? (widgets.pomodoroBreakMinutes ?? 5) * 60
    : widgets.pomodoroMinutes * 60;
  const remaining  = widgets.pomodoroRemainingSeconds;
  const progress   = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isDone     = remaining === 0;
  const timerLabel = `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;

  const handleFocusMode = () => {
    set({ focusModeActive: true, pomodoroRunning: true, pomodoroRemainingSeconds: remaining || widgets.pomodoroMinutes * 60 });
  };

  const switchMode = (toBreak: boolean) => {
    const mins = toBreak ? (widgets.pomodoroBreakMinutes ?? 5) : widgets.pomodoroMinutes;
    set({ pomodoroIsBreak: toBreak, pomodoroRemainingSeconds: mins * 60, pomodoroRunning: false });
  };

  return (
    <div className="w-64 relative">
      <WidgetShell
        label={locale === 'zh' ? '番茄鐘' : 'Pomodoro'}
        icon={<Timer className="h-3.5 w-3.5" />}
        meta={meta}
        glass={glass}
        hideExpand
        headerRight={
          <button
            type="button"
            onClick={handleFocusMode}
            className="mr-1 flex items-center gap-1 rounded-full bg-slate-800/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-800 hover:text-white"
            title={locale === 'zh' ? '專注模式' : 'Focus Mode'}
          >
            <Focus className="h-3 w-3" />
            {locale === 'zh' ? '專注' : 'Focus'}
          </button>
        }
        onMetaChange={(m) => set({ pomodoroMeta: m })}
      >
        <div className="flex w-full flex-col items-center gap-3">
          {/* Focus / Break tabs */}
          <div className="flex w-full gap-1 rounded-xl bg-black/6 p-0.5">
            <button type="button" onClick={() => switchMode(false)} className={['flex-1 rounded-[0.6rem] py-1 text-xs font-black transition', !isBreak ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
              {locale === 'zh' ? '專注' : 'Focus'}
            </button>
            <button type="button" onClick={() => switchMode(true)} className={['flex-1 rounded-[0.6rem] py-1 text-xs font-black transition', isBreak ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
              {locale === 'zh' ? '休息' : 'Break'}
            </button>
          </div>

          {/* Gauge dial with proper clipping */}
          <PomodoroGaugeDial
            progress={progress}
            isBreak={isBreak}
            timerLabel={timerLabel}
            isDone={isDone}
          />

          <div className="flex w-full items-center gap-2">
            <Timer className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <input
              type="number" min="1" max="90"
              value={isBreak ? (widgets.pomodoroBreakMinutes ?? 5) : widgets.pomodoroMinutes}
              onChange={(e) => {
                const m = Math.min(90, Math.max(1, Number(e.target.value) || 25));
                if (isBreak) set({ pomodoroBreakMinutes: m, pomodoroRemainingSeconds: m * 60, pomodoroRunning: false });
                else set({ pomodoroMinutes: m, pomodoroRemainingSeconds: m * 60, pomodoroRunning: false });
              }}
              className="w-12 rounded-lg bg-black/8 px-2 py-1 text-sm font-black text-slate-800 outline-none"
              data-testid="input-pomodoro-minutes"
            />
            <span className="text-xs font-bold text-slate-500">{locale === 'zh' ? '分鐘' : 'min'}</span>
          </div>

          <div className="flex w-full gap-2">
            {isDone ? (
              <button type="button" onClick={() => set({ pomodoroRemainingSeconds: widgets.pomodoroMinutes * 60, pomodoroRunning: false })} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-sm font-black text-white transition hover:bg-slate-700" data-testid="button-pomodoro-reset" aria-label="Reset">
                <RotateCcw className="h-4 w-4" />{locale === 'zh' ? '重置' : 'Reset'}
              </button>
            ) : (
              <button type="button" onClick={() => set({ pomodoroRemainingSeconds: remaining || widgets.pomodoroMinutes * 60, pomodoroRunning: !widgets.pomodoroRunning })} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-sm font-black text-white transition hover:bg-slate-700" data-testid="button-pomodoro-toggle" aria-label={widgets.pomodoroRunning ? 'Pause' : 'Start'}>
                {widgets.pomodoroRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {widgets.pomodoroRunning ? (locale === 'zh' ? '暫停' : 'Pause') : (locale === 'zh' ? '開始' : 'Start')}
              </button>
            )}
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
      <WidgetShell label="Quick Note" icon={<FileText className="h-3.5 w-3.5" />} meta={meta} glass={glass} headerRight={<span className="mr-1 text-[0.65rem] font-bold text-slate-400" aria-live="polite">{widgets.notes.length}</span>} onMetaChange={(m) => set({ notesMeta: m })}>
        <textarea value={widgets.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Quick Note…" className={['box-border w-full resize-none rounded-xl bg-black/6 p-3 text-sm font-bold leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:bg-black/10', meta.expanded ? 'min-h-36' : 'min-h-20'].join(' ')} data-testid="textarea-widget-note" />
      </WidgetShell>
    </div>
  );
}

// ── Focus Mode Overlay ───────────────────────────────────────────────────
type FocusModeOverlayProps = {
  widgets: WidgetState;
  onChange: (w: WidgetState) => void;
  backgroundClass: string;
};

export function FocusModeOverlay({ widgets, onChange, backgroundClass }: FocusModeOverlayProps) {
  const locale: Locale = detectLocale();
  const isBreak = widgets.pomodoroIsBreak ?? false;
  const totalSeconds = isBreak
    ? (widgets.pomodoroBreakMinutes ?? 5) * 60
    : widgets.pomodoroMinutes * 60;
  const remaining  = widgets.pomodoroRemainingSeconds;
  const progress   = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isDone     = remaining === 0;
  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');

  const set = (patch: Partial<WidgetState>) => onChange({ ...widgets, ...patch });

  const soundState: FocusSoundState = (widgets as any).focusSoundState ?? defaultFocusSoundState();
  const setSoundState = (s: FocusSoundState) => set({ ...(widgets as any), focusSoundState: s } as any);
  const [showSound, setShowSound] = useState(false);
  const soundRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showSound) return;
    const h = (e: MouseEvent) => { if (soundRef.current && !soundRef.current.contains(e.target as Node)) setShowSound(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSound]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString(locale === 'zh' ? 'zh-TW' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-GB', { weekday: 'long', month: 'long', day: 'numeric' });

  const justFinishedFocus = isDone && !isBreak;
  const justFinishedBreak = isDone && isBreak;

  const startBreak = () => {
    const mins = widgets.pomodoroBreakMinutes ?? 5;
    set({ pomodoroIsBreak: true, pomodoroRemainingSeconds: mins * 60, pomodoroRunning: true });
  };

  const switchMode = (toBreak: boolean) => {
    const mins = toBreak ? (widgets.pomodoroBreakMinutes ?? 5) : widgets.pomodoroMinutes;
    set({ pomodoroIsBreak: toBreak, pomodoroRemainingSeconds: mins * 60, pomodoroRunning: false });
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${backgroundClass}`}>
      <div className="absolute inset-0" style={{ backdropFilter: 'blur(3px)', background: 'rgba(0,0,0,0.45)' }} />
      <div className="relative z-10 flex flex-col items-center gap-6 select-none w-full max-w-sm px-6">
        <div className="text-center">
          <p className="text-7xl font-black text-white tracking-tight leading-none" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>{timeStr}</p>
          <p className="mt-2 text-base font-bold text-white/75 tracking-wide">{dateStr}</p>
        </div>
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 220 }}>
          <div style={{ overflow: 'hidden', width: 260, height: 220 }}>
            <GaugeDial progress={progress} isBreak={isBreak} />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] mb-1" style={{ color: isBreak ? '#34d399' : 'rgba(255,255,255,0.55)' }}>
              {isBreak ? (locale === 'zh' ? '休息' : 'BREAK') : (locale === 'zh' ? '專注' : 'FOCUS')}
            </p>
            {isDone ? (
              <span className="text-5xl">✅</span>
            ) : (
              <p className="text-6xl font-black text-white tabular-nums leading-none" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                {mm}<span className="text-white/50">:</span>{ss}
              </p>
            )}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
            <button type="button" onClick={() => switchMode(false)} className={['rounded-full px-4 py-1.5 text-xs font-black transition', !isBreak ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/15 text-white/70 hover:bg-white/25'].join(' ')}>
              {locale === 'zh' ? '專注' : 'Focus'}
            </button>
            <button type="button" onClick={() => switchMode(true)} className={['rounded-full px-4 py-1.5 text-xs font-black transition', isBreak ? 'bg-emerald-400 text-slate-900 shadow-lg' : 'bg-white/15 text-white/70 hover:bg-white/25'].join(' ')}>
              {locale === 'zh' ? '休息' : 'Break'}
            </button>
          </div>
        </div>
        {justFinishedFocus && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-white/80">{locale === 'zh' ? '🎉 專注完成！要休息一下嗎？' : '🎉 Focus done! Take a break?'}</p>
            <button onClick={startBreak} className="rounded-full bg-emerald-400 px-8 py-2.5 text-sm font-black text-slate-900 shadow-lg transition hover:bg-emerald-300">
              {locale === 'zh' ? `休息 ${widgets.pomodoroBreakMinutes ?? 5} 分鐘` : `Break ${widgets.pomodoroBreakMinutes ?? 5} min`}
            </button>
          </div>
        )}
        {justFinishedBreak && (
          <p className="text-sm font-bold text-white/80">{locale === 'zh' ? '☀️ 休息完成，繼續加油！' : '☀️ Break done, keep going!'}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {!isDone && (
            <button onClick={() => set({ pomodoroRunning: !widgets.pomodoroRunning })} className="flex items-center gap-2 rounded-full bg-white/22 px-7 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/32">
              {widgets.pomodoroRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {widgets.pomodoroRunning ? (locale === 'zh' ? '暫停' : 'Pause') : (locale === 'zh' ? '繼續' : 'Resume')}
            </button>
          )}
          {isDone && (
            <button onClick={() => set({ pomodoroRemainingSeconds: widgets.pomodoroMinutes * 60, pomodoroRunning: false, pomodoroIsBreak: false })} className="flex items-center gap-2 rounded-full bg-white/22 px-7 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/32">
              <RotateCcw className="h-4 w-4" />{locale === 'zh' ? '重置' : 'Reset'}
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowSound(v => !v)} className={['flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black backdrop-blur transition', showSound ? 'bg-white/30 text-white' : 'bg-white/14 text-white/80 hover:bg-white/22'].join(' ')}>
              🎵 {locale === 'zh