import { BotMessageSquare, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { AiPortal } from '../types';

type Props = {
  portals: AiPortal[];
};

function PortalIcon({ icon, name }: { icon: string; name: string }) {
  if (icon.startsWith('http') || icon.startsWith('data:')) {
    return <img src={icon} alt={name} className="h-5 w-5 rounded object-contain" />;
  }
  return <span className="text-base leading-none" role="img" aria-label={name}>{icon}</span>;
}

export function AiPortalBar({ portals }: Props) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabledPortals = portals.filter((p) => p.enabled);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 200);
  };

  return (
    <div
      className="fixed left-4 z-30"
      style={{
        // Position just above the PromptBook button: centre‑screen minus ~80px offset
        top: 'calc(50% - 88px)',
        transform: 'translateY(-50%)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger button */}
      <button
        type="button"
        aria-label="AI 入口"
        className={[
          'flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-white/70 shadow-lg backdrop-blur-md transition-all duration-200 hover:text-white',
          hovered ? 'bg-white/28' : 'bg-white/12 hover:bg-white/20',
        ].join(' ')}
      >
        <BotMessageSquare className="h-5 w-5" />
        <span
          className="text-[0.6rem] font-black uppercase tracking-widest"
          style={{ writingMode: 'vertical-rl' }}
        >
          AI
        </span>
      </button>

      {/* Fly-out portal list */}
      <div
        className={[
          'absolute left-full top-0 ml-2 flex flex-col gap-1.5 transition-all duration-200',
          hovered ? 'pointer-events-auto opacity-100 translate-x-0' : 'pointer-events-none opacity-0 -translate-x-2',
        ].join(' ')}
      >
        {enabledPortals.map((portal) => (
          <a
            key={portal.id}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            title={portal.name}
            className="group flex items-center gap-2 rounded-xl bg-white/18 px-3 py-2 text-white/90 shadow backdrop-blur-md transition hover:bg-white/32 hover:text-white"
          >
            <PortalIcon icon={portal.icon} name={portal.name} />
            <span className="whitespace-nowrap text-xs font-bold">{portal.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Settings Panel (used inside SettingsModal) ───────────────────────────
type PanelProps = {
  portals: AiPortal[];
  onChange: (portals: AiPortal[]) => void;
};

const BLANK: Omit<AiPortal, 'id' | 'builtIn' | 'enabled'> = { name: '', url: '', icon: '🤖' };

export function AiPortalSettingsPanel({ portals, onChange }: PanelProps) {
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK });

  const toggle = (id: string) =>
    onChange(portals.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));

  const remove = (id: string) =>
    onChange(portals.filter((p) => p.id !== id));

  const updateField = (id: string, field: keyof AiPortal, value: string) =>
    onChange(portals.map((p) => p.id === id ? { ...p, [field]: value } : p));

  const addPortal = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    const id = `custom-ai-${Date.now().toString(36)}`;
    onChange([...portals, { id, enabled: true, ...form, name: form.name.trim(), url: form.url.trim() }]);
    setForm({ ...BLANK });
  };

  return (
    <div className="grid gap-4">
      {/* List */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-black">AI 入口列表</h4>
        <div className="grid gap-2">
          {portals.map((portal) => (
            <div key={portal.id} className="flex items-center gap-2 rounded-xl bg-slate-950/5 px-3 py-2">
              {/* Enable toggle */}
              <button
                type="button"
                onClick={() => toggle(portal.id)}
                className={['h-5 w-9 rounded-full transition', portal.enabled ? 'bg-slate-950' : 'bg-slate-300'].join(' ')}
                title={portal.enabled ? '停用' : '啟用'}
              >
                <span className={['block h-4 w-4 rounded-full bg-white shadow transition-all', portal.enabled ? 'ml-[18px]' : 'ml-0.5'].join(' ')} />
              </button>

              {/* Icon editable */}
              <input
                value={portal.icon}
                onChange={(e) => updateField(portal.id, 'icon', e.target.value)}
                className="w-10 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-center text-sm"
                title="圖示 (emoji 或圖片URL)"
              />

              {/* Name editable */}
              <input
                value={portal.name}
                onChange={(e) => updateField(portal.id, 'name', e.target.value)}
                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold"
              />

              {/* URL editable */}
              <input
                value={portal.url}
                onChange={(e) => updateField(portal.id, 'url', e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500"
              />

              {/* Delete (only custom) */}
              {!portal.builtIn && (
                <button
                  type="button"
                  onClick={() => remove(portal.id)}
                  className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add new */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h4 className="mb-3 font-black">新增自定義 AI 入口</h4>
        <div className="flex flex-wrap gap-2">
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="圖示"
            className="w-14 rounded-xl border border-slate-950/10 px-2 py-2 text-center text-sm font-bold"
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="名稱"
            className="w-28 rounded-xl border border-slate-950/10 px-3 py-2 text-sm font-bold"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-xl border border-slate-950/10 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addPortal}
            disabled={!form.name.trim() || !form.url.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />新增
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">圖示可填 emoji，或貼上圖片 URL。自定義項目可刪除，內建項目可停用。</p>
      </div>
    </div>
  );
}
