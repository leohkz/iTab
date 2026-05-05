import { Minus, Pencil } from 'lucide-react';
import { useRef } from 'react';
import { AppIcon } from './AppIcon';
import type { AppShortcut } from '../types';

const MAX_ADDITIONAL_SIZE = 5;

function scaleValue(value: number, from: [number, number], to: [number, number]) {
  const scale = (to[1] - to[0]) / (from[1] - from[0]);
  const capped = Math.min(from[1], Math.max(from[0], value));
  return capped * scale - from[0] * scale + to[0];
}

type DockProps = {
  pinnedApps: AppShortcut[];
  recentTabs: AppShortcut[];
  editing: boolean;
  glass: number;
  onDropApp: (appId: string) => void;
  onUnpinApp: (appId: string) => void;
  onRenameApp: (appId: string) => void;
};

export function Dock({ pinnedApps, recentTabs, editing, glass: _glass, onDropApp, onUnpinApp, onRenameApp }: DockProps) {
  const dockRef = useRef<HTMLUListElement>(null);

  const handleAppHover = (ev: React.MouseEvent<HTMLLIElement>) => {
    if (!dockRef.current) return;
    const mouseX = ev.clientX;
    const rect = ev.currentTarget.getBoundingClientRect();
    const cursorDistance = (mouseX - rect.left) / rect.width;
    const offsetPx = scaleValue(cursorDistance, [0, 1], [-MAX_ADDITIONAL_SIZE, MAX_ADDITIONAL_SIZE]);
    dockRef.current.style.setProperty('--dock-offset-left', `${offsetPx * -1}px`);
    dockRef.current.style.setProperty('--dock-offset-right', `${offsetPx}px`);
  };

  const renderItem = (app: AppShortcut, isRecent: boolean) => (
    <li
      key={app.id}
      className="app"
      onMouseMove={editing ? undefined : handleAppHover}
      data-testid={isRecent ? `dock-recent-${app.id}` : `dock-pinned-${app.id}`}
    >
      {editing ? (
        <span
          className="app-link animate-jiggle"
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
          aria-label={app.name}
        >
          <AppIcon app={app} size="dock" />
          {/* Delete button */}
          <button
            type="button"
            aria-label={`Remove ${app.name} from dock`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnpinApp(app.id); }}
            className="absolute -left-1 -top-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {/* Edit button */}
          <button
            type="button"
            aria-label={`Edit ${app.name}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRenameApp(app.id); }}
            className="absolute -right-1 -top-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-white/92 text-slate-950 shadow-lg"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ) : (
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${app.name}`}
        >
          <AppIcon app={app} size="dock" />
        </a>
      )}
      <span className="tooltip" aria-hidden="true">{app.name}</span>
      {isRecent && <span className="dock-dot" />}
    </li>
  );

  return (
    <div className="dock-root" aria-label="Dock">
      <nav
        className={['dock', editing ? 'dock--editing' : ''].join(' ')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const appId = e.dataTransfer.getData('text/plain');
          if (appId) onDropApp(appId);
        }}
        data-testid="dock-drop-target"
      >
        <ul ref={dockRef}>
          {pinnedApps.map((app) => renderItem(app, false))}
          {recentTabs.length > 0 && (
            <>
              <li aria-hidden="true"><span className="dock-separator" /></li>
              {recentTabs.map((app) => renderItem(app, true))}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
