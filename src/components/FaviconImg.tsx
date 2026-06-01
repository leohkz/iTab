/**
 * FaviconImg — tries each source in sequence until one loads.
 * Falls back to a letter avatar if all sources fail.
 */
import { useState } from 'react';
import { getFaviconSources } from '../lib/favicon';

interface FaviconImgProps {
  /** The full URL of the site (used to derive the domain) */
  siteUrl: string;
  /** Optional custom icon URL override (skips the fallback chain) */
  customIcon?: string;
  /** Display name — used for letter avatar fallback */
  name: string;
  size?: number;
  className?: string;
  letterClassName?: string;
}

export function FaviconImg({ siteUrl, customIcon, name, size = 28, className = '', letterClassName = '' }: FaviconImgProps) {
  const sources = customIcon && customIcon !== 'auto'
    ? [customIcon, ...getFaviconSources(siteUrl)]
    : getFaviconSources(siteUrl);

  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || sources.length === 0) {
    return (
      <span
        className={['flex items-center justify-center rounded-md bg-slate-200 font-black text-slate-500 select-none', letterClassName].join(' ')}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      key={sources[idx]}
      src={sources[idx]}
      alt={name}
      width={size}
      height={size}
      className={className}
      onError={() => {
        if (idx + 1 < sources.length) setIdx(idx + 1);
        else setFailed(true);
      }}
    />
  );
}
