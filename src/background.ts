// Background service worker
// Builds context menu entries from stored search engines,
// and rebuilds them whenever storage changes.
// Note: "%s" (selected text) is NOT shown in the title per user preference.

const CONFIG_KEY = 'workspace-new-tab-config';
const PARENT_ID  = 'itab-search-parent';

interface SearchEngine {
  id: string;
  name: string;
  template: string;
  enabled: boolean;
}

function buildMenus(engines: SearchEngine[]) {
  chrome.contextMenus.removeAll(() => {
    const enabled = engines.filter((e) => e.enabled && e.template);
    if (enabled.length === 0) return;

    chrome.contextMenus.create({
      id:       PARENT_ID,
      title:    'iTab 搜索',
      contexts: ['selection'],
    });

    enabled.forEach((engine) => {
      chrome.contextMenus.create({
        id:       `itab-${engine.id}`,
        parentId: PARENT_ID,
        title:    engine.name,   // no "%s", just the engine name
        contexts: ['selection'],
      });
    });
  });
}

function loadAndBuild() {
  chrome.storage.local.get(CONFIG_KEY, (result) => {
    const cfg = result[CONFIG_KEY] as { searchEngines?: SearchEngine[] } | undefined;
    buildMenus(cfg?.searchEngines ?? []);
  });
}

// Build on install / startup
chrome.runtime.onInstalled.addListener(loadAndBuild);
chrome.runtime.onStartup.addListener(loadAndBuild);

// Rebuild whenever config changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[CONFIG_KEY]) loadAndBuild();
});

// Handle clicks
chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.menuItemId.toString().startsWith('itab-')) return;
  if (info.menuItemId === PARENT_ID) return;

  const engineId = info.menuItemId.toString().replace('itab-', '');
  const selected  = info.selectionText ?? '';
  if (!selected) return;

  chrome.storage.local.get(CONFIG_KEY, (result) => {
    const cfg = result[CONFIG_KEY] as { searchEngines?: SearchEngine[] } | undefined;
    const engine = cfg?.searchEngines?.find((e) => e.id === engineId);
    if (!engine?.template) return;
    const url = engine.template.replace('{q}', encodeURIComponent(selected));
    chrome.tabs.create({ url });
  });
});
