// ── GitHub Gist Cloud Sync ────────────────────────────────────────────────────
// Storage keys (chrome.storage.local)
export const GIST_TOKEN_KEY  = 'gistToken';
export const GIST_ID_KEY     = 'gistId';
export const GIST_AUTO_KEY   = 'gistAutoSync';
export const GIST_USER_KEY   = 'gistUser';
const GIST_FILENAME          = 'itab-settings.json';
const API_BASE               = 'https://api.github.com';
const DEVICE_CLIENT_ID       = 'Ov23liU0ZbkfEAhL4g4a';

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// ── Storage helpers ─────────────────────────────────────────────────────────────
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

export async function removeStorageItem(key: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  }
  localStorage.removeItem(key);
}

// ── Device Flow ───────────────────────────────────────────────────────────────
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: DEVICE_CLIENT_ID, scope: 'gist' }),
  });
  if (!res.ok) throw new Error(`Device code request failed: ${res.status}`);
  return res.json();
}

export async function pollDeviceToken(
  deviceCode: string,
  intervalSec: number,
  signal?: AbortSignal,
): Promise<string> {
  const poll = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const tick = async () => {
        if (signal?.aborted) { reject(new Error('cancelled')); return; }
        try {
          const res = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              client_id: DEVICE_CLIENT_ID,
              device_code: deviceCode,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
          });
          const data = await res.json();
          if (data.access_token) { resolve(data.access_token); return; }
          if (data.error === 'authorization_pending' || data.error === 'slow_down') {
            const wait = data.error === 'slow_down' ? (intervalSec + 5) * 1000 : intervalSec * 1000;
            setTimeout(tick, wait);
          } else {
            reject(new Error(data.error_description ?? data.error ?? 'unknown error'));
          }
        } catch (e) { reject(e); }
      };
      setTimeout(tick, intervalSec * 1000);
    });
  return poll();
}

// ── Auto-find existing iTab Gist ───────────────────────────────────────────────
/**
 * After login, scan the user's gists for an existing itab-settings.json.
 * Returns the gist ID if found, or empty string if not found.
 */
export async function findExistingGist(token: string): Promise<string> {
  let page = 1;
  while (true) {
    const res = await fetch(`${API_BASE}/gists?per_page=100&page=${page}`, {
      headers: headers(token),
    });
    if (!res.ok) return '';
    const gists = await res.json() as Array<{ id: string; files: Record<string, unknown> }>;
    if (gists.length === 0) return '';
    const found = gists.find((g) => GIST_FILENAME in g.files);
    if (found) return found.id;
    if (gists.length < 100) return ''; // last page
    page++;
  }
}

// ── Upload (backup to Gist) ───────────────────────────────────────────────────
export async function uploadToGist(token: string, gistId: string, data: object): Promise<string> {
  const content = JSON.stringify({ _version: 1, _savedAt: new Date().toISOString(), ...data }, null, 2);
  const body = JSON.stringify({
    description: 'iTab Settings Backup',
    public: false,
    files: { [GIST_FILENAME]: { content } },
  });
  if (gistId) {
    const res = await fetch(`${API_BASE}/gists/${gistId}`, { method: 'PATCH', headers: headers(token), body });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    return (await res.json()).id as string;
  } else {
    const res = await fetch(`${API_BASE}/gists`, { method: 'POST', headers: headers(token), body });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    return (await res.json()).id as string;
  }
}

// ── Download (restore from Gist) ─────────────────────────────────────────────
export async function downloadFromGist(token: string, gistId: string): Promise<object> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, { method: 'GET', headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const file = json.files?.[GIST_FILENAME];
  if (!file) throw new Error(`File "${GIST_FILENAME}" not found in Gist`);
  const raw: string = file.truncated
    ? await (await fetch(file.raw_url)).text()
    : (file.content as string);
  const parsed = JSON.parse(raw);
  const { _version: _v, _savedAt: _s, ...settings } = parsed;
  return settings;
}

// ── Validate token ───────────────────────────────────────────────────────────────
export async function validateToken(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Invalid token (${res.status})`);
  return (await res.json()).login as string;
}
