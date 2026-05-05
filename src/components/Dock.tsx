import { AppIcon } from './AppIcon';
import type { AppShortcut } from '../types';

type DockProps = {
  pinnedApps: AppShortcut[];
  recentTabs: AppShortcut[];
  editing: boolean;
  glass: number;
  onDropApp: (appId: string) => void;
};

export function Dock({ pinnedApps, recentTabs, editing, glass, onDropApp }: DockProps) {
  const surfaceAlpha = Math.min(0.44, Math.max(0.14, glass / 245));
  const blurPx = Math.round(10 + glass / 7);

  return (
    <aside
      className={[
        'fixed bottom-5 left-1/2 w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2',
        editing ? 'z-[70]' : 'z-30',
      ].join(' ')}
      aria-label="Dock"
    >
      <div
        className={[
          'flex items-end justify-center gap-2 rounded-[1.65rem] border border-white/30 px-4 py-3 shadow-[0_24px_70px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.3)] transition duration-200',
          editing ? 'ring-2 ring-white/55' : '',
        ].join(' ')}
        style={{
          backgroundColor: `rgba(255,255,255,${surfaceAlpha})`,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
        }}
        onMouseMove={(e) => {
          const container = e.currentTarget;
          const icons = container.querySelectorAll<HTMLElement>('[data-dock-icon]');
          icons.forEach((icon) => {
            const rect = icon.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const dist = Math.abs(e.clientX - cx);
            const maxDist = 100;
            const scale = dist < maxDist ? 1 + 0.58 * Math.cos((dist / maxDist) * (Math.PI / 2)) : 1;
            icon.style.transform = `scale(${scale}) translateY(${dist < maxDist ? -(scale - 1) * 14 : 0}px)`;
          });
        }}
        onMouseLeave={(e) => {
          const container = e.currentTarget;
          const icons = container.querySelectorAll<HTMLElement>('[data-dock-icon]');
          icons.forEach((icon) => {
            icon.style.transform = '';
          });
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const appId = event.dataTransfer.getData('text/plain');
          if (appId) onDropApp(appId);
        }}
        data-testid="dock-drop-target"
      >
        {/* Pinned apps */}
        <div className="flex items-end gap-2 border-r border-white/25 pr-3">
          {pinnedApps.map((app) => (
            <div
              key={app.id}
              data-dock-icon
              draggable={editing}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', app.id);
              }}
              style={{ transition: editing ? 'none' : 'transform 120ms cubic-bezier(0.16,1,0.3,1)', transformOrigin: 'bottom center' }}
            >
              {editing ? (
                <span
                  className="block rounded-[1.15rem] cursor-grab animate-jiggle"
                  data-testid={`dock-pinned-${app.id}`}
                >
                  <AppIcon app={app} size="dock" />
                </span>
              ) : (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${app.name}`}
                  className="block rounded-[1.15rem]"
                  data-testid={`dock-pinned-${app.id}`}
                >
                  <AppIcon app={app} size="dock" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Recent tabs */}
        <div className="flex items-end gap-2">
          {recentTabs.map((app) => (
            <div
              key={app.id}
              data-dock-icon
              draggable={editing}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', app.id);
              }}
              style={{ transition: editing ? 'none' : 'transform 120ms cubic-bezier(0.16,1,0.3,1)', transformOrigin: 'bottom center' }}
              className="relative"
            >
              {editing ? (
                <span
                  className="block rounded-[1.15rem] cursor-grab animate-jiggle"
                  data-testid={`dock-recent-${app.id}`}
                >
                  <AppIcon app={app} size="dock" />
                </span>
              ) : (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open recent ${app.name}`}
                  className="block rounded-[1.15rem]"
                  data-testid={`dock-recent-${app.id}`}
                >
                  <AppIcon app={app} size="dock" />
                </a>
              )}
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/78" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
