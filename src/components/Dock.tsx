import { Minus, Pencil } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { AppIcon } from './AppIcon';
import type { AppShortcut } from '../types';

const BASE = 52;
const MAX = 82;
const SPREAD = 130; // px radius within which magnification applies

type DockProps = {
  pinnedApps: AppShortcut[];
  recentTabs: AppShortcut[];
  editing: boolean;
  glass: number;
  onDropApp: (appId: string) => void;
  onUnpinApp: (appId: string) => void;
  onRenameApp: (appId: string) => void;
};

export function Dock({ pinnedApps, recentTabs, editing, glass, onDropApp, onUnpinApp, onRenameApp }: DockProps) {
  const dockRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);
  // Bug#2 fix: store computed sizes in state, updated via useLayoutEffect to avoid 1-frame rect lag
  const [sizes, setSizes] = useState<number[]>([]);

  const allApps = [
    ...pinnedApps.map((app) => ({ app, isRecent: false })),
    ...recentTabs.map((app) => ({ app, isRecent: true })),
  ];

  useLayoutEffect(() => {
    if (editing || mouseX === null) {
      setSizes(allApps.map(() => BASE));
      return;
    }
    const next = itemRefs.current.map((el) => {
      if (!el) return BASE;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(mouseX - centerX);
      if (dist >= SPREAD) return BASE;
      const ratio = 1 - dist / SPREAD;
      return Math.round(BASE + (MAX - BASE) * ratio);
    });
    setSizes(next);
  }, [mouseX, editing, allApps.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLUListElement>) => {
    setMouseX(e.clientX);
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setSizes(allApps.map(() => BASE));
  };

  // Derive glass style for dock pill background
  const dockAlpha = Math.min(0.45, Math.max(0.10, glass / 250));
  const dockBlur  = Math.round(6 + glass / 10);
  const dockStyle: React.CSSProperties = {
    backgroundColor: `rgba(255,255,255,${dockAlpha})`,
    backdropFilter: `blur(${dockBlur}px)`,
    WebkitBackdropFilter: `blur(${dockBlur}px)`,
  };

  const renderItem = (app: AppShortcut, isRecent: boolean, index: number) => {
    const size = sizes[index] ?? BASE;
    const marginTop = BASE - size;

    return (
      <li
        key={app.id}
        ref={(el) => { itemRefs.current[index] = el; }}
        className="app"
        style={{ width: size, height: size, marginTop }}
        data-testid={isRecent ? `dock-recent-${app.id}` : `dock-pinned-${app.id}`}
      >
        {editing ? (
          <span
            className="app-link animate-jiggle"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
            aria-label={app.name}
          >
            {/* Bug#14 fix: use object-contain wrapper to prevent icon stretch at dynamic sizes */}
            <span className="flex h-full w-full items-center justify-center overflow-hidden">
              <AppIcon app={app} size="dock" />
            </span>
            <button
              type="button"
              aria-label={`Remove ${app.name} from dock`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnpinApp(app.id); }}
              className="absolute -left-1 -top-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-white shadow-lg"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
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
            <span className="flex h-full w-full items-center justify-center overflow-hidden">
              <AppIcon app={app} size="dock" />
            </span>
          </a>
        )}
        <span className="tooltip" aria-hidden="true">{app.name}</span>
        {isRecent && <span className="dock-dot" />}
      </li>
    );
  };

  return (
    <div className="dock-root" aria-label="Dock">
      <nav
        className={['dock', editing ? 'dock--editing' : ''].join(' ')}
        style={dockStyle}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const appId = e.dataTransfer.getData('text/plain');
          if (appId) onDropApp(appId);
        }}
        data-testid="dock-drop-target"
      >
        <ul
          ref={dockRef}
          onMouseMove={editing ? undefined : handleMouseMove}
          onMouseLeave={editing ? undefined : handleMouseLeave}
        >
          {pinnedApps.map((app, i) => renderItem(app, false, i))}
          {recentTabs.length > 0 && (
            <>
              <li aria-hidden="true"><span className="dock-separator" /></li>
              {recentTabs.map((app, i) => renderItem(app, true, pinnedApps.length + i))}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
