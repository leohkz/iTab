import { useState } from 'react';
import type { AppShortcut } from '../types';
import { getFaviconUrl, getInitials } from '../lib/favicon';

type AppIconProps = {
  app: AppShortcut;
  size?: 'grid' | 'dock' | 'mini';
};

const sizeClasses = {
  grid: 'h-[4.5rem] w-[4.5rem] rounded-[1.35rem]',
  dock: 'h-full w-full rounded-[13px]',
  mini: 'h-6 w-6 rounded-[0.48rem]',
};

const monogramSizes = {
  grid: 'text-xl',
  dock: 'text-sm',
  mini: 'text-[0.62rem]',
};

const faviconSizes = {
  grid: 'h-[62%] w-[62%]',
  dock: 'h-[60%] w-[60%]',
  mini: 'h-[70%] w-[70%]',
};

function autoAccent(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = input.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 72% 62%)`;
}

export function AppIcon({ app, size = 'grid' }: AppIconProps) {
  const [failed, setFailed] = useState(app.iconType === 'monogram');
  const iconSource = app.iconType === 'custom' ? app.iconValue : getFaviconUrl(app.iconValue || app.url);
  const accent = app.iconColor ?? autoAccent(app.url || app.name);

  // Dock icons are fully opaque — no glass/transparency
  const isDock = size === 'dock';

  const baseClass = [
    'relative flex shrink-0 items-center justify-center overflow-hidden',
    isDock
      ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_12px_rgba(17,24,39,0.3)]'
      : 'border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_40px_rgba(17,24,39,0.22)]',
    sizeClasses[size],
  ].join(' ');

  const bgStyle: React.CSSProperties = isDock
    ? {
        // Fully opaque gradient — no alpha
        background:
          app.iconType === 'monogram' || failed
            ? `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, white), color-mix(in oklab, ${accent} 78%, #111827))`
            : `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, white), color-mix(in oklab, ${accent} 55%, white))`,
        isolation: 'isolate',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }
    : {
        background:
          app.iconType === 'monogram' || failed
            ? `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, white), color-mix(in oklab, ${accent} 72%, #111827))`
            : `linear-gradient(135deg, color-mix(in oklab, ${accent} 16%, white), rgba(255,255,255,.55))`,
        isolation: 'isolate',
        transform: 'translateZ(0)',
        willChange: 'transform',
      };

  return (
    <span
      className={baseClass}
      style={bgStyle}
      data-testid={`icon-${app.id}`}
    >
      {!failed ? (
        <img
          src={iconSource}
          alt=""
          className={`object-contain ${faviconSizes[size]}`}
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
          style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 12%, white), color-mix(in oklab, ${accent} 66%, white))` }}
          aria-hidden="true"
        >
          {getInitials(app.name)}
        </span>
      )}
    </span>
  );
}
