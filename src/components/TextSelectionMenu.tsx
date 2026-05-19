import { useEffect, useRef, useState } from 'react';
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

export function TextSelectionMenu({ engines }: Props) {
  const enabledEngines = engines.filter((e) => e.enabled);
  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0, text: '' });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const selected = window.getSelection()?.toString().trim();
      if (!selected) return;
      e.preventDefault();
      // Keep menu within viewport
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const menuW = 200;
      const menuH = enabledEngines.length * 40 + 8;
      const x = Math.min(e.clientX, vw - menuW - 8);
      const y = Math.min(e.clientY, vh - menuH - 8);
      setMenu({ visible: true, x, y, text: selected });
    };

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu((m) => ({ ...m, visible: false }));
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [enabledEngines.length]);

  const search = (engine: SearchEngine) => {
    const url = engine.template.replace('{q}', encodeURIComponent(menu.text));
    window.open(url, '_blank');
    setMenu((m) => ({ ...m, visible: false }));
  };

  if (!menu.visible || enabledEngines.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl"
      style={{ left: menu.x, top: menu.y }}
    >
      <div className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
        Search: <span className="font-bold text-slate-600 normal-case tracking-normal">&ldquo;{menu.text.length > 24 ? menu.text.slice(0, 24) + '…' : menu.text}&rdquo;</span>
      </div>
      {enabledEngines.map((engine) => (
        <button
          key={engine.id}
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-950/8 transition-colors"
          onClick={() => search(engine)}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(engine.template.replace('{q}', 'x')).hostname}&sz=16`}
            alt=""
            className="h-4 w-4 rounded"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          {engine.name}
          <span className="ml-auto text-xs font-semibold text-slate-400">/{engine.shortcut}</span>
        </button>
      ))}
    </div>
  );
}
