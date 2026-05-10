// ── GitHub Gist Cloud Sync ────────────────────────────────────────────────────
// Storage keys (chrome.storage.local)
export const GIST_TOKEN_KEY  = 'gistToken';
export const GIST_ID_KEY     = 'gistId';
export const GIST_AUTO_KEY   = 'gistAutoSync';
const GIST_FILENAME          = 'itab-settings.json';
const API_BASE               = 'https://api.github.com';

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// ── Storage helpers (works in extension + dev mode) ──────────────────────────
export async function getStorageItem(key: string): Promise<string> {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (r) => resolve((r[key] as string) ?? ''));
    });
  }
  return localStorage.getItem(key) ?? '';
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }
  localStorage.setItem(key, value);
}

// ── Upload (backup to Gist) ───────────────────────────────────────────────────
export async function uploadToGist(
  token: string,
  gistId: string,
  data: object,
): Promise<string> {
  const content = JSON.stringify({ _version: 1, _savedAt: new Date().toISOString(), ...data }, null, 2);
  const body = JSON.stringify({
    description: 'iTab Settings Backup',
    public: false,
    files: { [GIST_FILENAME]: { content } },
  });

  if (gistId) {
    // Update existing gist
    const res = await fetch(`${API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: headers(token),
      body,
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.id as string;
  } else {
    // Create new gist
    const res = await fetch(`${API_BASE}/gists`, {
      method: 'POST',
      headers: headers(token),
      body,
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.id as string;
  }
}

// ── Download (restore from Gist) ─────────────────────────────────────────────
export async function downloadFromGist(
  token: string,
  gistId: string,
): Promise<object> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: 'GET',
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const file = json.files?.[GIST_FILENAME];
  if (!file) throw new Error(`File "${GIST_FILENAME}" not found in Gist`);

  // If content is truncated, fetch raw_url
  const raw: string = file.truncated
    ? await (await fetch(file.raw_url)).text()
    : (file.content as string);

  const parsed = JSON.parse(raw);
  // Remove meta fields before returning
  const { _version: _v, _savedAt: _s, ...settings } = parsed;
  return settings;
}

// ── Validate token by calling /user ──────────────────────────────────────────
export async function validateToken(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Invalid token (${res.status})`);
  const json = await res.json();
  return json.login as string;
}
