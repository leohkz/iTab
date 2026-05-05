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
  const surfaceAlpha = Math.min(0.72, Math.max(0.55, glass / 120));
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
      {/* Todo */}
      <section className="rounded-[1.35rem] border border-black/8 p-4 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.12)]" style={glassStyle}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t('todo')}</p>
          <button
            type="button"
            onClick={addTodo}
            className="grid h-7 w-7 place-items-center rounded-full bg-black/8 transition hover:bg-black/14"
            data-testid="button-widget-add-todo"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-2">
          {widgets.todos.map((todo) => (
            <label key={todo.id} className="flex items-center gap-2 rounded-xl bg-black/6 px-2 py-2 text-sm font-bold text-slate-800">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={(event) =>
                  onChange({
                    ...widgets,
                    todos: widgets.todos.map((item) => (item.id === todo.id ? { ...item, done: event.target.checked } : item)),
                  })
                }
                className="accent-slate-700"
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
                className="min-w-0 flex-1 bg-transparent text-slate-800 ou