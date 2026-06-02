import { useState } from 'react';
import type { AppShortcut } from '../types';
import { getFaviconUrl, getInitials } from '../lib/favicon';

type AppIconProps = {
  app: AppShortcut;
  size?: 'grid' | 'dock' | 'mini';
};

// grid: 72px × 30% ≈ 21.6px → rounded-[1.35rem]
// dock: 52px × 30% ≈ 16px  → rounded-[16px]  (fixed so it looks correct at base size)
// mini: 24px × 30% ≈ 7px   → rounded-[0.48rem]
const sizeClasses = {
  grid: 'h-[4.5rem] w-[4.5rem] rounded-[1.35rem]',
  dock: 'h-full w-full rounded-[16px]',
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
  return `hsl(${Math.abs(hash) % 360} 72% 55%)`;
}

export function AppIcon({ app, size = 'grid' }: AppIconProps) {
  const [failed, setFailed] = useState(app.iconType === 'monogram');
  const iconSource = app.iconType === 'custom' ? app.iconValue : getFaviconUrl(app.iconValue || app.url);
  const accent = app.iconColor ?? autoAccent(app.url || app.name);

  return (
    <span
      className={[
        'relative flex shrink-0 items-center justify-center overflow-hidden',
        'bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(17,24,39,0.18)]',
        sizeClasses[size],
      ].join(' ')}
      style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
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
            'flex h-full w-full items-center justify-center font-black tracking-[-0.04em] text-white',
            monogramSizes[size],
          ].join(' ')}
          style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 70%, #111827))` }}
          aria-hidden="true"
        >
          {getInitials(app.name)}
        </span>
      )}
    </span>
  );
}
