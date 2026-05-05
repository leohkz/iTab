import { useState } from 'react';
import type { AppShortcut } from '../types';
import { getFaviconUrl, getInitials } from '../lib/favicon';

type AppIconProps = {
  app: AppShortcut;
  size?: 'grid' | 'dock' | 'mini';
};

const sizeClasses = {
  grid: 'h-[4.5rem] w-[4.5rem] rounded-[1.35rem]',
  // dock icons fill the parent <li> which controls size via CSS
  dock: 'h-full w-full rounded-[12px]',
  mini: 'h-6 w-6 rounded-[0.48rem]',
};

const monogramSizes = {
  grid: 'text-xl',
  dock: 'text-base',
  mini: 'text-[0.62rem]',
};

function autoAccent(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = input.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 62%)`;
}

export function AppIcon({ app, size = 'grid' }: AppIconProps) {
  const [failed, setFailed] = useState(app.iconType === 'monogram');
  const iconSource = app.iconType === 'custom' ? app.iconValue : getFaviconUrl(app.iconValue || app.url);
  const accent = app.iconColor ?? autoAccent(app.url || app.name);

  return (
    <span
      className={[
        'relative flex shrink-0 items-center justify-center overflow-hidden border border-white/40 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_40px_rgba(17,24,39,0.22)]',
        sizeClasses[size],
      ].join(' ')}
      style={{
        background:
          app.iconType === 'monogram' || failed
            ? `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, white), color-mix(in oklab, ${accent} 72%, #111827))`
            : `linear-gradient(135deg, color-mix(in oklab, ${accent} 16%, white), rgba(255,255,255,.55))`,
      }}
      data-testid={`icon-${app.id}`}
    >
      {!failed ? (
        <img
          src={iconSource}
          alt=""
          className="h-[62%] w-[62%] object-contain"
          decoding="async"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={[
            'flex h-full w-full items-center justify-center font-black tracking-[-0.04em] text-slate-800',
            monogramSizes[size],
          ].join(' ')}
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 12%, white), color-mix(in oklab, ${accent} 66%, white))`,
          }}
          aria-hidden="true"
        >
          {getInitials(app.name)}
        </span>
      )}
    </span>
  );
}
