import { Pause, Play, Plus, Timer, Trash2 } from 'lucide-react';
import type { WidgetState } from '../types';
import type { TranslationKey } from '../i18n';

type WidgetsProps = {
  widgets: WidgetState;
  glass: number;
  t: (key: TranslationKey) => string;
  onChange: (widgets: WidgetState) => void;
};

export function Widgets({ widgets, glass, t, onChange }: WidgetsProps) {
  const surfaceAlpha = Math.min(0.38, Math.max(0.12, glass / 275));
  const blurPx = Math.round(8 + glass / 9);
  const glassStyle = {
    backgroundColor: `rgba(255,255,255,${surfaceAlpha})`,
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
  };

  const addTodo = () => {
    onChange({
      ...widgets,
      todos: [...widgets.todos, { id: `todo-${Date.now().toString(36)}`, text: 'New task', done: false }],
    });
  };
  const minutes = Math.floor(widgets.pomodoroRemainingSeconds / 60);
  const seconds = widgets.pomodoroRemainingSeconds % 60;
  const timerLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <aside className="fixed right-5 top-24 z-20 grid w-64 gap-3 max-xl:hidden" aria-label="Widgets">
      <section className="rounded-[1.35rem] border border-white/20 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" style={glassStyle}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">{t('todo')}</p>
          <button
            type="button"
            onClick={addTodo}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/16 transition hover:bg-white/26"
            data-testid="button-widget-add-todo"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-2">
          {widgets.todos.map((todo) => (
            <label key={todo.id} className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={(event) =>
                  onChange({
                    ...widgets,
                    todos: widgets.todos.map((item) => (item.id === todo.id ? { ...item, done: event.target.checked } : item)),
                  })
                }
                className="accent-white"
                data-testid={`input-widget-todo-${todo.id}`}
              />
              <input
                value={todo.text}
                onChange={(event) =>
                  onChange({
                    ...widgets,
                    todos: widgets.todos.map((item) => (item.id === todo.id ? { ...item, text: event.target.value } : item)),
                  })
                }
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => onChange({ ...widgets, todos: widgets.todos.filter((item) => item.id !== todo.id) })}
                className="text-white/62 hover:text-white"
                data-testid={`button-widget-delete-todo-${todo.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-white/20 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" style={glassStyle}>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-white/55">{t('pomodoro')}</p>
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" aria-hidden="true" />
            <input
              type="number"
              min="1"
              max="90"
              value={widgets.pomodoroMinutes}
              onChange={(event) => {
                const nextMinutes = Math.min(90, Math.max(1, Number(event.target.value) || 25));
                onChange({ ...widgets, pomodoroMinutes: nextMinutes, pomodoroRemainingSeconds: nextMinutes * 60, pomodoroRunning: false });
              }}
              className="w-16 rounded-lg bg-white/12 px-2 py-1 text-lg font-black outline-none"
              data-testid="input-pomodoro-minutes"
            />
            <span className="text-sm font-bold text-white/70">min</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/14 px-3 py-1 text-sm font-black tabular-nums" data-testid="text-pomodoro-timer">
              {timerLabel}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...widgets,
                  pomodoroRemainingSeconds: widgets.pomodoroRemainingSeconds || widgets.pomodoroMinutes * 60,
                  pomodoroRunning: !widgets.pomodoroRunning,
                })
              }
              className="grid h-10 w-10 place-items-center rounded-full bg-white/16 transition hover:bg-white/26"
              data-testid="button-pomodoro-toggle"
            >
              {widgets.pomodoroRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-white/20 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" style={glassStyle}>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-white/55">Quick note</p>
        <textarea
          value={widgets.notes}
          onChange={(event) => onChange({ ...widgets, notes: event.target.value })}
          className="min-h-20 w-full resize-none rounded-xl bg-white/12 p-3 text-sm font-bold leading-5 outline-none placeholder:text-white/40"
          data-testid="textarea-widget-note"
        />
      </section>
    </aside>
  );
}
