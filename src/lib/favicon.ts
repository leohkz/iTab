/**
 * getFaviconUrl — multi-source fallback chain
 *
 * Priority:
 * 1. Custom icon override (engine.icon / app.iconValue if iconType==='url')
 * 2. DuckDuckGo favicon API (works for most sites incl. CN domains)
 * 3. Google S2 favicon (high quality, 32px)
 * 4. Direct /favicon.ico path
 */

export function getDomain(url: string): string {
  try { return new URL(url).hostname; }
  catch { return ''; }
}

/** Returns ordered list of favicon URLs to try for a given site URL */
export function getFaviconSources(url: string): string[] {
  const domain = getDomain(url);
  if (!domain) return [];
  return [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    `https://${domain}/favicon.ico`,
  ];
}

/** Single best-effort URL (DuckDuckGo first) */
export function getFaviconUrl(url: string): string {
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Returns 1-2 letter initials from a display name.
 * e.g. "Google Search" → "GS", "GitHub" → "GH", "豆包" → "豆"
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0] ?? '';
  return w.slice(0, 2).toUpperCase();
}
