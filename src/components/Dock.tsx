import { Minus, Pencil } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { AppIcon } from './AppIcon';
import type { AppShortcut } from '../types';

const BASE = 52;
const MAX = 82;
const SPREAD = 130;

type DockProps = {
  pinnedApps: AppShortcut[];
  recentTabs: AppShortcut[];
  editing: boolean;
  glass: number;
  onDropApp: (appId: string) => void;
  onUnpinApp: (appId: string) => void;
  onRenameApp: (appId: string) => void;
};

// Badge size = ~22% of icon, min 18px
function badgeSize(iconSize: number) {
  return Math.max(18, Math.round(iconSize * 0.28));
}

// Apple-style glass confirm dialog for Dock
function DockDeleteConfirm({ name, onConfirm, onCancel }: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center pb-40"
      style={{ animation: 'fadeIn 0.15s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="mx-4 w-full max-w-xs overflow-hidden rounded-[1.6rem] shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          border: '1px solid rgba(255,255,255,0.55)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 text-center">
          <p className="text-[0.93rem] font-black text-slate-900">Remove from Dock?</p>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">&ldquo;{name}&rdquo;</p>
        </div>
        <div className="flex border-t border-slate-200/70">
          <button
            type="button" onClick={onCancel}
            className="flex-1 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/60"
          >
            Cancel
          </button>
          <span className="w-px bg-slate-200/70" />
          <button
            type="button" onClick={onConfirm}
            className="flex-1 py-3 text-sm font-black text-red-500 transition hover:bg-red-50/60"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export function Dock({ pinnedApps, recentTabs, editing, glass, onDropApp, onUnpinApp, onRenameApp }: DockProps) {
  const dockRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [sizes, setSizes] = useState<number[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const allApps = [
    ...pinnedApps.map((app) => ({ app, isRecent: false })),
    ...recentTabs.map((app) => ({ app, isRecent: true })),
  ];

  useLayoutEffect(() => {
    if (editing || mouseX === null) { setSizes(allApps.map(() => BASE)); return; }
    const next = itemRefs.current.map((el) => {
      if (!el) return BASE;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(mouseX - (rect.left + rect.width / 2));
      if (dist >= SPREAD) return BASE;
      return Math.round(BASE + (MAX - BASE) * (1 - dist / SPREAD));
    });
    setSizes(next);
  }, [mouseX, editing, allApps.length]);

  const dockAlpha = Math.min(0.45, Math.max(0.10, glass / 250));
  const dockBlur  = Math.round(6 + glass / 10);
  const dockStyle: React.CSSProperties = {
    backgroundColor: `rgba(255,255,255,${dockAlpha})`,
    backdropFilter: `blur(${dockBlur}px)`,
    WebkitBackdropFilter: `blur(${dockBlur}px)`,
  };

  const confirmApp = allApps.find((a) => a.app.id === confirmId)?.app ?? null;

  const renderItem = (app: AppShortcut, isRecent: boolean, index: number) => {
    const size = sizes[index] ?? BASE;
    const marginTop = BASE - size;
    const bSize = badgeSize(size);
    const offset = Math.round(bSize * -0.28);

    // icon wrapper: clipped to same radius as AppIcon dock (rounded-[1.35rem] = 21.6px at 72px)
    const wrapRadius = Math.round(size * 0.3);
    const iconWrapper: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%',
      borderRadius: wrapRadius,
      overflow: 'hidden', isolation: 'isolate',
    };

    // Apple-glass badge base style
    const badgeBase: React.CSSProperties = {
      position: 'absolute', zIndex: 20,
      width: bSize, height: bSize,
      borderRadius: '50%',
      display: 'grid', placeItems: 'center',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
      border: '1px solid rgba(255,255,255,0.6)',
    };

    return (
      <li
        key={app.id}
        ref={(el) => { itemRefs.current[index] = el; }}
        className="app"
        style={{ width: size, height: size, marginTop }}
        data-testid={isRecent ? `dock-recent-${app.id}` : `dock-pinned-${app.id}`}
      >
        {editing ? (
          <span className="app-link animate-jiggle" draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
            aria-label={app.name}
          >
            <span style={iconWrapper}>
              <AppIcon app={app} size="dock" />
            </span>

            {/* Remove badge — top-left */}
            <button
              type="button"
              aria-label={`Remove ${app.name} from dock`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmId(app.id); }}
              style={{ ...badgeBase, top: offset, left: offset }}
            >
              <Minus style={{ width: bSize * 0.48, height: bSize * 0.48, color: '#ef4444', strokeWidth: 3 }} />
            </button>

            {/* Edit badge — top-right */}
            <button
              type="button"
              aria-label={`Edit ${app.name}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRenameApp(app.id); }}
              style={{ ...badgeBase, top: offset, right: offset }}
            >
              <Pencil style={{ width: bSize * 0.44, height: bSize * 0.44, color: '#334155', strokeWidth: 2 }} />
            </button>
          </span>
        ) : (
          <a href={app.url} target="_blank" rel="noreferrer" aria-label={`Open ${app.name}`}>
            <span style={iconWrapper}>
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
    <>
      <div className="dock-root" aria-label="Dock">
        <nav
          className={['dock', editing ? 'dock--editing' : ''].join(' ')}
          style={dockStyle}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { const appId = e.dataTransfer.getData('text/plain'); if (appId) onDropApp(appId); }}
          data-testid="dock-drop-target"
        >
          <ul
            ref={dockRef}
            onMouseMove={editing ? undefined : (e) => setMouseX(e.clientX)}
            onMouseLeave={editing ? undefined : () => { setMouseX(null); setSizes(allApps.map(() => BASE)); }}
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

      {confirmApp && (
        <DockDeleteConfirm
          name={confirmApp.name}
          onConfirm={() => { onUnpinApp(confirmId!); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}
