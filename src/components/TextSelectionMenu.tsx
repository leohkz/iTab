import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchEngine } from '../types';

type Props = {
  engines: SearchEngine[];
};

type MenuState = {
  visible: boolean;
  x: number;
  y: number;
  text: string;
};

function getFaviconUrl(template: string | undefined): string {
  try {
    if (!template) return '';
    const hostname = new URL(template.replace('{q}', 'x')).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  } catch {
    return '';
  }
}

export function TextSelectionMenu({ engines }: Props) {
  const enabledEngines = engines.filter((e) => e.enabled);
  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0, text: '' });
  const menuRef = useRef<HTMLDivElement>(null);
  const enginesRef = useRef(enabledEngines);
  enginesRef.current = enabledEngines;

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Ignore clicks inside our own menu
    if (menuRef.current?.contains(e.target as Node)) return;

    // Small delay to let the browser finalize the selection
    setTimeout(() => {
      const selected = window.getSelection()?.toString().trim();
      if (!selected || enginesRef.current.length === 0) {
        setMenu((m) => ({ ...m, visible: false }));
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const menuW = 220;
      const menuH = enginesRef.current.length * 44 + 40;
      // Position the toolbar just above the cursor
      const x = Math.min(e.clientX, vw - menuW - 8);
      const y = Math.max(8, Math.min(e.clientY - menuH - 12, vh - menuH - 8));
      setMenu({ visible: true, x, y, text: selected });
    }, 10);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenu((m) => ({ ...m, visible: false }));
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  const search = (engine: SearchEngine) => {
    if (!engine.template) return;
    const url = engine.template.replace('{q}', encodeURIComponent(menu.text));
    window.open(url, '_blank');
    setMenu((m) => ({ ...m, visible: false }));
  };

  if (!menu.visible || enabledEngines.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-xl"
      style={{ left: menu.x, top: menu.y }}
    >
      <div className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
        Search: <span className="font-bold text-slate-600 normal-case tracking-normal">&ldquo;{menu.text.length > 24 ? menu.text.slice(0, 24) + '\u2026' : menu.text}&rdquo;</span>
      </div>
      {enabledEngines.map((engine) => (
        <button
          key={engine.id}
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-950/8 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => search(engine)}
        >
          {getFaviconUrl(engine.template) && (
            <img
              src={getFaviconUrl(engine.template)}
              alt=""
              className="h-4 w-4 rounded"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="flex-1">{engine.name}</span>
          <span className="text-xs font-semibold text-slate-400">/{engine.shortcut}</span>
        </button>
      ))}
    </div>
  );
}
