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
  const surfaceAlpha = Math.min(0.52, Math.max(0.22, glass / 200));
  const blurPx = Math.round(16 + glass / 6);

  const renderItem = (app: AppShortcut, isRecent: boolean) => (
    <div key={app.id} className="dock-item" data-testid={isRecent ? `dock-recent-${app.id}` : `dock-pinned-${app.id}`}>
      <div className="dock-item-inner">
        {editing ? (
          <span
            className="animate-jiggle block cursor-grab"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
          >
            <AppIcon app={app} size="dock" />
          </span>
        ) : (
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${app.name}`}
            className="block"
          >
            <AppIcon app={app} size="dock" />
          </a>
        )}
      </div>
      {isRecent && (
        <span className="dock-dot" />
      )}
    </div>
  );

  return (
    <aside
      className={['dock-root', editing ? 'z-[70]' : 'z-30'].join(' ')}
      aria-label="Dock"
    >
      <div
        className={['dock-container', editing ? 'ring-2 ring-white/55' : ''].join(' ')}
        style={{
          backgroundColor: `rgba(255,255,255,${surfaceAlpha})`,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const appId = e.dataTransfer.getData('text/plain');
          if (appId) onDropApp(appId);
        }}
        data-testid="dock-drop-target"
      >
        {/* Pinned */}
        <div className="dock-section dock-section--pinned">
          {pinnedApps.map((app) => renderItem(app, false))}
        </div>

        {/* Separator */}
        {recentTabs.length > 0 && (
          <span className="dock-separator" aria-hidden="true" />
        )}

        {/* Recent */}
        {recentTabs.length > 0 && (
          <div className="dock-section dock-section--recent">
            {recentTabs.map((app) => renderItem(app, true))}
          </div>
        )}
      </div>
    </aside>
  );
}
