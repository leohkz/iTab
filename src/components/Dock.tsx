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
    <aside className={['fixed bottom-5 left-1/2 w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2', editing ? 'z-[70]' : 'z-30'].join(' ')} aria-label="Dock">
      <div
        className={[
          'flex items-center justify-center gap-3 rounded-[1.65rem] border border-white/30 px-3 py-3 shadow-[0_24px_70px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.3)] transition duration-200',
          editing ? 'ring-2 ring-white/55' : '',
        ].join(' ')}
        style={{
          backgroundColor: `rgba(255,255,255,${surfaceAlpha})`,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const appId = event.dataTransfer.getData('text/plain');
          if (appId) onDropApp(appId);
        }}
        data-testid="dock-drop-target"
      >
        <div className="flex items-center gap-2 border-r border-white/25 pr-3">
          {pinnedApps.map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${app.name}`}
              className="rounded-[1.15rem] transition duration-200 hover:-translate-y-2 active:translate-y-0"
              data-testid={`dock-pinned-${app.id}`}
            >
              <AppIcon app={app} size="dock" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {recentTabs.map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open recent ${app.name}`}
              className="relative rounded-[1.15rem] transition duration-200 hover:-translate-y-2 active:translate-y-0"
              data-testid={`dock-recent-${app.id}`}
            >
              <AppIcon app={app} size="dock" />
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/78" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
