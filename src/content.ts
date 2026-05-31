// Content script — injected into every page
// Shows a tiny dot after text selection; clicking it reveals an engine grid.

const CONFIG_KEY = 'workspace-new-tab-config';
const MENU_ID    = '__itab_search_menu__';
const DOT_ID     = '__itab_dot__';

interface SearchEngine {
  id: string;
  name: string;
  shortcut: string;
  template: string;
  enabled: boolean;
}

interface StoredConfig {
  searchEngines?: SearchEngine[];
}

function getFaviconUrl(template: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(template.replace('{q}', 'x')).hostname}&sz=32`;
  } catch {
    return '';
  }
}

function removeMenu() {
  document.getElementById(MENU_ID)?.remove();
}

function removeDot() {
  document.getElementById(DOT_ID)?.remove();
}

function removeAll() {
  removeMenu();
  removeDot();
}

function createMenu(engines: SearchEngine[], text: string, x: number, y: number) {
  removeMenu();

  const COLS    = 4;
  const CELL    = 72;
  const PAD     = 10;
  const menuW   = COLS * CELL + PAD * 2;
  const rows    = Math.ceil(engines.length / COLS);
  const menuH   = rows * (CELL + 4) + PAD * 2;
  const vw      = window.innerWidth;
  const vh      = window.innerHeight;
  const left    = Math.min(x, vw - menuW - 12);
  const top     = Math.min(y + 12, vh - menuH - 12);

  const menu = document.createElement('div');
  menu.id = MENU_ID;

  Object.assign(menu.style, {
    position:             'fixed',
    left:                 `${left}px`,
    top:                  `${top}px`,
    zIndex:               '2147483647',
    width:                `${menuW}px`,
    background:           'rgba(15,23,42,0.88)',
    backdropFilter:       'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius:         '18px',
    border:               '1px solid rgba(255,255,255,0.1)',
    boxShadow:            '0 16px 48px rgba(0,0,0,0.5)',
    padding:              `${PAD}px`,
    fontFamily:           '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display:              'grid',
    gridTemplateColumns:  `repeat(${COLS}, 1fr)`,
    gap:                  '4px',
    boxSizing:            'border-box',
  });

  engines.forEach((engine) => {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      justifyContent:'center',
      gap:           '5px',
      padding:       '8px 4px',
      background:    'rgba(255,255,255,0.06)',
      border:        '1px solid rgba(255,255,255,0.08)',
      borderRadius:  '12px',
      cursor:        'pointer',
      color:         '#f1f5f9',
      fontFamily:    'inherit',
      transition:    'background 0.15s',
    });
    btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.15)'; btn.style.borderColor = 'rgba(255,255,255,0.2)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.06)'; btn.style.borderColor = 'rgba(255,255,255,0.08)'; };

    const faviconUrl = getFaviconUrl(engine.template);
    if (faviconUrl) {
      const img = document.createElement('img');
      img.src = faviconUrl;
      img.width = 22; img.height = 22;
      img.style.cssText = 'border-radius:6px;display:block;';
      img.onerror = () => img.remove();
      btn.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      Object.assign(placeholder.style, { width:'22px', height:'22px', borderRadius:'6px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#94a3b8' });
      placeholder.textContent = engine.name.charAt(0).toUpperCase();
      btn.appendChild(placeholder);
    }

    const nameSpan = document.createElement('span');
    Object.assign(nameSpan.style, { fontSize:'10px', fontWeight:'700', textAlign:'center', lineHeight:'1.2', maxWidth:'64px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.75)' });
    nameSpan.textContent = engine.name;
    btn.appendChild(nameSpan);

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
    btn.addEventListener('click', () => {
      const url = engine.template.replace('{q}', encodeURIComponent(text));
      window.open(url, '_blank');
      removeAll();
    });

    menu.appendChild(btn);
  });

  document.documentElement.appendChild(menu);
}

function showDot(text: string, x: number, y: number) {
  removeDot();
  removeMenu();

  const dot = document.createElement('div');
  dot.id = DOT_ID;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const SIZE = 9;
  const left = Math.min(x + 6, vw - SIZE - 4);
  const top  = Math.min(y - SIZE - 4, vh - SIZE - 4);

  Object.assign(dot.style, {
    position:   'fixed',
    left:       `${left}px`,
    top:        `${top}px`,
    width:      `${SIZE}px`,
    height:     `${SIZE}px`,
    borderRadius:'50%',
    background: 'rgba(30,58,138,0.55)',
    border:     '1px solid rgba(99,102,241,0.4)',
    cursor:     'pointer',
    zIndex:     '2147483647',
    transition: 'opacity 0.2s, background 0.15s',
    boxSizing:  'border-box',
  });

  dot.onmouseenter = () => { dot.style.background = 'rgba(99,102,241,0.75)'; };
  dot.onmouseleave = () => { dot.style.background = 'rgba(30,58,138,0.55)'; };

  dot.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
  dot.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.storage.local.get(CONFIG_KEY, (result) => {
      const cfg = result[CONFIG_KEY] as StoredConfig | undefined;
      const engines: SearchEngine[] = (cfg?.searchEngines ?? []).filter(
        (eng) => eng.enabled && eng.template,
      );
      if (engines.length === 0) { removeDot(); return; }
      const r = dot.getBoundingClientRect();
      createMenu(engines, text, r.left, r.bottom + 4);
      removeDot();
    });
  });

  document.documentElement.appendChild(dot);

  setTimeout(() => {
    const d = document.getElementById(DOT_ID);
    if (d) { d.style.opacity = '0'; setTimeout(() => d.remove(), 200); }
  }, 4000);
}

document.addEventListener('mouseup', (e) => {
  const target = e.target as Element;
  if (target?.id === DOT_ID || target?.id === MENU_ID || target?.closest?.(`#${MENU_ID}`)) return;

  const selected = window.getSelection()?.toString().trim();
  if (!selected) { removeAll(); return; }

  showDot(selected, e.clientX, e.clientY);
});

document.addEventListener('mousedown', (e) => {
  const target = e.target as Element;
  const menu = document.getElementById(MENU_ID);
  const dot  = document.getElementById(DOT_ID);
  if (menu && !menu.contains(target)) removeMenu();
  if (dot  && !dot.contains(target))  removeDot();
}, true);

window.addEventListener('scroll', removeAll, true);
window.addEventListener('resize', removeAll);
