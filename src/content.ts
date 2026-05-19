// Content script — injected into every page
// Reads searchEngines from chrome.storage.local and shows a custom
// right-click context menu when text is selected.

const CONFIG_KEY = 'workspace-new-tab-config';
const MENU_ID    = '__itab_search_menu__';

interface SearchEngine {
  id: string;
  name: string;
  shortcut: string;
  template: string;
  enabled: boolean;
}

function getFaviconUrl(template: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(template.replace('{q}', 'x')).hostname}&sz=16`;
  } catch {
    return '';
  }
}

function removeMenu() {
  document.getElementById(MENU_ID)?.remove();
}

function createMenu(engines: SearchEngine[], text: string, x: number, y: number) {
  removeMenu();

  const menu = document.createElement('div');
  menu.id = MENU_ID;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 220;
  const menuH = engines.length * 44 + 40;
  const left = Math.min(x, vw - menuW - 8);
  const top  = Math.min(y, vh - menuH - 8);

  Object.assign(menu.style, {
    position:        'fixed',
    left:            `${left}px`,
    top:             `${top}px`,
    zIndex:          '2147483647',
    minWidth:        `${menuW}px`,
    background:      'rgba(255,255,255,0.96)',
    backdropFilter:  'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius:    '16px',
    border:          '1px solid rgba(0,0,0,0.1)',
    boxShadow:       '0 8px 40px rgba(0,0,0,0.18)',
    overflow:        'hidden',
    fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  });

  // Header
  const header = document.createElement('div');
  const label  = text.length > 26 ? text.slice(0, 26) + '\u2026' : text;
  Object.assign(header.style, {
    padding:      '8px 12px',
    fontSize:     '11px',
    fontWeight:   '900',
    textTransform:'uppercase',
    letterSpacing:'0.12em',
    color:        '#94a3b8',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  });
  header.textContent = `Search: \u201c${label}\u201d`;
  menu.appendChild(header);

  // Engine rows
  engines.forEach((engine) => {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      width:          '100%',
      padding:        '10px 12px',
      background:     'none',
      border:         'none',
      cursor:         'pointer',
      fontSize:       '13px',
      fontWeight:     '700',
      color:          '#1e293b',
      textAlign:      'left',
      fontFamily:     'inherit',
    });
    btn.onmouseenter = () => { btn.style.background = 'rgba(15,23,42,0.06)'; };
    btn.onmouseleave = () => { btn.style.background = 'none'; };

    const faviconUrl = getFaviconUrl(engine.template);
    if (faviconUrl) {
      const img = document.createElement('img');
      img.src = faviconUrl;
      img.width = 16; img.height = 16;
      img.style.borderRadius = '3px';
      img.onerror = () => img.remove();
      btn.appendChild(img);
    }

    const nameSpan = document.createElement('span');
    nameSpan.style.flex = '1';
    nameSpan.textContent = engine.name;
    btn.appendChild(nameSpan);

    const shortcutSpan = document.createElement('span');
    Object.assign(shortcutSpan.style, { fontSize: '11px', color: '#94a3b8', fontWeight: '600' });
    shortcutSpan.textContent = `/${engine.shortcut}`;
    btn.appendChild(shortcutSpan);

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
    btn.addEventListener('click', () => {
      const url = engine.template.replace('{q}', encodeURIComponent(text));
      window.open(url, '_blank');
      removeMenu();
    });

    menu.appendChild(btn);
  });

  document.documentElement.appendChild(menu);
}

// Close menu on outside click
document.addEventListener('mousedown', (e) => {
  const menu = document.getElementById(MENU_ID);
  if (menu && !menu.contains(e.target as Node)) removeMenu();
}, true);

// Close on scroll / resize
window.addEventListener('scroll', removeMenu, true);
window.addEventListener('resize', removeMenu);

// Show menu on right-click when text is selected
document.addEventListener('contextmenu', (e) => {
  const selected = window.getSelection()?.toString().trim();
  if (!selected) { removeMenu(); return; }

  chrome.storage.local.get(CONFIG_KEY, (result) => {
    const cfg = result[CONFIG_KEY];
    if (!cfg) return;
    const engines: SearchEngine[] = (cfg.searchEngines ?? []).filter(
      (eng: SearchEngine) => eng.enabled && eng.template,
    );
    if (engines.length === 0) return;

    e.preventDefault();
    createMenu(engines, selected, e.clientX, e.clientY);
  });
}, true);
