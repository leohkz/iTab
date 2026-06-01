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
