import { Pause, Play, Plus, RotateCcw, Timer, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import type { WidgetState } from '../types';
import type { TranslationKey } from '../i18n';

type WidgetsProps = {
  widgets: WidgetState;
  glass: number;
  t: (key: TranslationKey) => string;
  onChange: (widgets: WidgetState) => void;
};

function PomodoroRing({ progress }: { progress: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);
  return (
    <svg width="72" height="72" className="-rotate-90" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#0f172a"
        strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

export function Widgets({ widgets, glass, t, onChange }: WidgetsProps) {
  const newTodoRef = useRef<HTMLInputElement>(null);

  const surfaceAlpha = Math.min(0.72, Math.max(0.55, glass / 120));
  const blurPx = Math.round(8 + glass / 9);
  const glassStyle = {
    backgroundColor: `rgba(255,255,255,${surfaceAlpha})`,
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
  };

  const addTodo = (text?: string) => {
    const label = text?.trim() || t('todo');
    onChange({
      ...widgets,
      todos: [...widgets.todos, { id: `todo-${Date.now().toString(36)}`, text: label, done: false }],
    });
  };

  const totalSeconds = widgets.pomodoroMinutes * 60;
  const remaining = widgets.pomodoroRemainingSeconds;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isDone = remaining === 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timerLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const noteLen = widgets.notes.length;

  return (
    // 修復核心：改用 flex flex-col 取代 grid，加 overflow-hidden、w-64 完全封鎖寬度
    <aside
      className="fixed right-5 top-24 z-20 flex w-64 flex-col gap-3 overflow-hidden max-xl:hidden"
      aria-label="Widgets"
    >
      {/* ─── Todo ───────────────────────────────────── */}
      <section
        className="box-border w-full rounded-[1.35rem] border border-black/8 p-4 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.12)]"
        style={glassStyle}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t('todo')}</p>
          <button
            type="button"
            onClick={() => addTodo()}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/8 transition hover:bg-black/14"
            data-testid="button-widget-add-todo"
            aria-label="Add todo"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* overflow-hidden + w-full 防止 todo 列表擐開容器 */}
        <div className="flex w-full flex-col gap-2 overflow-hidden">
          {widgets.todos.map((todo) => (
            <div key={todo.id} className="flex w-full items-center gap-2 overflow-hidden rounded-xl bg-black/6 px-2 py-2">
              <input
                id={`todo-cb-${todo.id}`}
                type="checkbox"
                checked={todo.done}
                onChange={(e) =>
                  onChange({
                    ...widgets,
                    todos: widgets.todos.map((item) =>
                      item.id === todo.id ? { ...item, done: e.target.checked } : item
                    ),
                  })
                }
                className="shrink-0 accent-slate-700"
                data-testid={`input-widget-todo-${todo.id}`}
              />
              {/* 關鍵：minWidth:0 防止 flex 子元素擐開父容器 */}
              <input
                value={todo.text}
                onChange={(e) =>
                  onChange({
                    ...widgets,
                    todos: widgets.todos.map((item) =>
                      item.id === todo.id ? { ...item, text: e.target.value } : item
                    ),
                  })
                }
                style={{ minWidth: 0 }}
                className={[
                  'w-full flex-1 bg-transparent text-sm font-bold outline-none transition-all duration-200',
                  todo.done ? 'text-slate-400 line-through' : 'text-slate-800',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...widgets, todos: widgets.todos.filter((item) => item.id !== todo.id) })
                }
                className="shrink-0 text-slate-400 transition hover:text-slate-700"
                data-testid={`button-widget-delete-todo-${todo.id}`}
                aria-label="Delete todo"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        {/* Enter 鍵新增框：box-border + w-full 絕對不擐開 */}
        <div className="mt-2 box-border w-full">
          <input
            ref={newTodoRef}
            type="text"
            placeholder={`+ ${t('todo')}…`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                addTodo(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            style={{ minWidth: 0 }}
            className="box-border w-full rounded-xl bg-black/6 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:bg-black/10"
            data-testid="input-widget-new-todo"
          />
        </div>
      </section>

      {/* ─── Pomodoro ────────────────────────────────── */}
      <section
        className="box-border w-full rounded-[1.35rem] border border-black/8 p-4 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.12)]"
        style={glassStyle}
      >
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t('pomodoro')}</p>
        <div className="flex w-full flex-col items-center gap-3">
          <div className="relative">
            <PomodoroRing progress={progress} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isDone ? (
                <span className="text-lg">✅</span>
              ) : (
                <span className="text-sm font-black tabular-nums text-slate-800" data-testid="text-pomodoro-timer">
                  {timerLabel}
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                type="number"
                min="1"
                max="90"
                value={widgets.pomodoroMinutes}
                onChange={(e) => {
                  const nextMinutes = Math.min(90, Math.max(1, Number(e.target.value) || 25));
                  onChange({
                    ...widgets,
                    pomodoroMinutes: nextMinutes,
                    pomodoroRemainingSeconds: nextMinutes * 60,
                    pomodoroRunning: false,
                  });
                }}
                className="w-12 rounded-lg bg-black/8 px-2 py-1 text-sm font-black text-slate-800 outline-none"
                data-testid="input-pomodoro-minutes"
              />
              <span className="text-xs font-bold text-slate-500">min</span>
            </div>
            <div className="flex gap-2">
              {isDone ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...widgets, pomodoroRemainingSeconds: widgets.pomodoroMinutes * 60, pomodoroRunning: false })
                  }
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
                  data-testid="button-pomodoro-reset"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...widgets,
                      pomodoroRemainingSeconds: remaining || widgets.pomodoroMinutes * 60,
                      pomodoroRunning: !widgets.pomodoroRunning,
                    })
                  }
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/8 text-slate-700 transition hover:bg-black/14"
                  data-testid="button-pomodoro-toggle"
                  aria-label={widgets.pomodoroRunning ? 'Pause' : 'Start'}
                >
                  {widgets.pomodoroRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick Note ───────────────────────────────── */}
      <section
        className="box-border w-full rounded-[1.35rem] border border-black/8 p-4 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.12)]"
        style={glassStyle}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t('quickNote')}</p>
          <span className="text-[0.65rem] font-bold text-slate-400" aria-live="polite">{noteLen}</span>
        </div>
        <textarea
          value={widgets.notes}
          onChange={(e) => onChange({ ...widgets, notes: e.target.value })}
          placeholder={t('quickNote') + '…'}
          className="box-border min-h-20 w-full resize-none rounded-xl bg-black/6 p-3 text-sm font-bold leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:bg-black/10"
          data-testid="textarea-widget-note"
        />
      </section>
    </aside>
  );
}
