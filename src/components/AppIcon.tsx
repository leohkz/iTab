import { useState } from 'react';
import type { AppShortcut } from '../types';

type Props = {
  app: AppShortcut;
  size?: 'grid' | 'dock' | 'folder';
  dark?: boolean;
};

function getFaviconUrl(url: string): string {
  try {
    const encoded = encodeURIComponent(url);
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encoded}&size=64`;
  } catch {
    return '';
  }
}

export function AppIcon({ app, size = 'grid', dark = false }: Props) {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === 'dock' ? 'w-12 h-12 rounded-2xl text-2xl' :
    size === 'folder' ? 'w-8 h-8 rounded-xl text-base' :
    'w-14 h-14 rounded-[18px] text-2xl';

  const bgClass = dark
    ? 'bg-[#2c2c2e] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
    : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]';

  if (app.iconType === 'emoji' && app.iconValue) {
    return (
      <div className={`${sizeClass} ${bgClass} flex items-center justify-center flex-shrink-0`}>
        <span>{app.iconValue}</span>
      </div>
    );
  }

  if (app.iconType === 'letter') {
    const color = app.iconColor ?? '#6366f1';
    return (
      <div
        className={`${sizeClass} flex items-center justify-center flex-shrink-0 font-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}
        style={{ backgroundColor: color }}
      >
        <span>{(app.iconValue ?? app.name).charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  const faviconUrl = getFaviconUrl(app.url);

  if (!imgError && faviconUrl) {
    return (
      <div className={`${sizeClass} ${bgClass} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src={faviconUrl}
          alt={app.name}
          className="w-3/4 h-3/4 object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const color = app.iconColor ?? '#6366f1';
  return (
    <div
      className={`${sizeClass} flex items-center justify-center flex-shrink-0 font-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}
      style={{ backgroundColor: color }}
    >
      <span>{app.name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
