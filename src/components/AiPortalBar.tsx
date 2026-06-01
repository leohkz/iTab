import { BotMessageSquare, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { AiPortal, AiPortalSize } from '../types';
import type { TranslationKey } from '../i18n';

function getIconSrc(icon: string, url: string): string | null {
  if (icon.startsWith('http') || icon.startsWith('data:')) return icon;
  if (icon === 'auto') {
    try {
      const encoded = encodeURIComponent(url);
      return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encoded}&size=64`;
    } catch {
      return null;
    }
  }
  return null;
}

const SIZE_MAP: Record<AiPortalSize, { img: number; btn: string; text: string; gap: string; px: string; py: string }> = {
  sm: { img: 18, btn: 'rounded-xl',  text: 'text-xs',  gap: 'gap-2',   px: 'px-3', py: 'py-2' },
  md: { img: 24, btn: 'rounded-xl',  text: 'text-sm',  gap: 'gap-2.5', px: 'px-3', py: 'py-2.5' },
  lg: { img: 28, btn: 'rounded-2xl', text: 'text-sm',  gap: 'gap-3',   px: 'px-4', py: 'py-3' },
  xl: { img: 36, btn: 'rounded-2xl', text: 'text-base',gap: 'gap-3',   px: 'px-5', py: 'py-3.5' },
};

function glassStyle(glass: number, alphaScale = 1): React.CSSProperties {
  const alpha = Math.min(0.45, Math.max(0.08, (glass / 250))) * alphaScale;
  const blur  = Math.round(4 + glass / 10);
  return {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };
}

function PortalIcon({ icon, url, name, size }: { icon: string; url: string; name: string; size: number }) {
  const src = getIconSrc(icon, url);
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setErrored(true)}
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-sm object-contain"
      />
    );
  }
  return (
    <span
      className="flex-shrink-0 select-none leading-none"
      style={{ fontSize: size, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      role="img"
      aria-label={name}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

type Props = {
  portals: AiPortal[];
  size?: AiPortalSize;
  glass: number;
  t: (key: TranslationKey) => string;
};

export function AiPortalBar({ portals, size = 'lg', glass, t }: Props) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabledPortals = portals.filter((p) => p.enabled);
  const s = SIZE_MAP[size];

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 200);
  };

  const triggerStyle = glassStyle(glass, hovered ? 1.6 : 1);
  const itemStyle    = glassStyle(glass, 1.4);

  return (
    <div
      className="fixed left-4 z-30"
      style={{ top: 'calc(50% - 88px)', transform: 'translateY(-50%)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-label={t('aiPortals')}
        className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-white/70 shadow-lg transition-all duration-200 hover:text-white"
        style={triggerStyle}
      >
        <BotMessageSquare className="h-5 w-5" />
        <span
          className="text-[0.6rem] font-black uppercase tracking-widest"
          style={{ writingMode: 'vertical-rl' }}
        >
          AI
        </span>
      </button>

      <div
        className={[
          `absolute left-full top-0 ml-2 flex flex-col ${s.gap} transition-all duration-200`,
          hovered
            ? 'pointer-events-auto opacity-100 translate-x-0'
            : 'pointer-events-none opacity-0 -translate-x-2',
        ].join(' ')}
      >
        {enabledPortals.map((portal) => (
          <a
            key={portal.id}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            title={portal.name}
            className={`group flex items-center ${s.gap} ${s.btn} ${s.px} ${s.py} text-white/90 shadow transition hover:text-white`}
            style={itemStyle}
          >
            <PortalIcon icon={portal.icon} url={portal.url} name={portal.name} size={s.img} />
            <span className={`whitespace-nowrap ${s.text} font-bold`}>{portal.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

type PanelProps = {
  portals: AiPortal[];
  size: AiPortalSize;
  dark?: boolean;
  onChange: (portals: AiPortal[]) => void;
  onSizeChange: (size: AiPortalSize) => void;
  t: (key: TranslationKey) => string;
};

const BLANK: Omit<AiPortal, 'id' | 'builtIn' | 'enabled'> = { name: '', url: '', icon: 'auto' };

export function AiPortalSettingsPanel({ portals, size, dark = false, onChange, onSizeChange, t }: PanelProps) {
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
    onChange([
      ...portals,
      { id, enabled: true, builtIn: false, ...form, name: form.name.trim(), url: form.url.trim() },
    ]);
    setForm({ ...BLANK });
  };

  const SIZES: AiPortalSize[] = ['sm', 'md', 'lg', 'xl'];
  const SIZE_LABELS: Record<AiPortalSize, string> = {
    sm: t('sizeSm'), md: t('sizeMd'), lg: t('sizeLg'), xl: t('sizeXl'),
  };

  // dark / light tokens
  const card      = dark ? 'rounded-2xl bg-[#2c2c2e] p-4' : 'rounded-2xl bg-white p-4 shadow-sm';
  const heading   = dark ? 'mb-3 font-black text-white' : 'mb-3 font-black text-slate-900';
  const sizeActiveBtn = dark
    ? 'bg-blue-600 text-white border-blue-600'
    : 'bg-slate-950 text-white border-slate-950';
  const sizeIdleBtn = dark
    ? 'bg-white/8 text-white/70 border-white/10 hover:border-white/30'
    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400';
  const previewBar = dark ? 'mt-4 flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3' : 'mt-4 flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3';
  const previewLabel = dark ? 'text-xs text-white/30 font-bold w-12 shrink-0' : 'text-xs text-slate-400 font-bold w-12 shrink-0';
  const previewItem = dark ? 'bg-[#3a3a3c]' : 'bg-white shadow-sm';
  const previewItemText = dark ? 'text-white' : 'text-slate-800';
  const rowBg      = dark ? 'flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2' : 'flex items-center gap-2 rounded-xl bg-slate-950/5 px-3 py-2';
  const iconThumb  = dark ? 'h-7 w-7 rounded-md bg-white/10 flex items-center justify-center overflow-hidden' : 'h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden';
  const inputCls   = dark
    ? 'rounded-lg border border-white/10 bg-white/8 px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none'
    : 'rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700';
  const toggleOn   = dark ? 'bg-blue-500' : 'bg-slate-950';
  const toggleOff  = dark ? 'bg-white/20' : 'bg-slate-300';
  const removeBtn  = dark ? 'grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-white/30 hover:bg-red-500/20 hover:text-red-400' : 'grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500';
  const addInput   = dark
    ? 'rounded-xl border border-white/10 bg-white/8 px-2 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none'
    : 'rounded-xl border border-slate-950/10 px-2 py-2 text-xs';
  const addInputMd = dark
    ? 'w-28 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none'
    : 'w-28 rounded-xl border border-slate-950/10 px-3 py-2 text-sm font-bold';
  const addInputFlex = dark
    ? 'min-w-0 flex-1 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none'
    : 'min-w-0 flex-1 rounded-xl border border-slate-950/10 px-3 py-2 text-sm';
  const hintText   = dark ? 'mt-2 text-xs text-white/30' : 'mt-2 text-xs text-slate-400';

  return (
    <div className="grid gap-4">
      <div className={card}>
        <h4 className={heading}>{t('portalButtonSize')}</h4>
        <div className="flex gap-2 flex-wrap">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSizeChange(s)}
              className={[
                'rounded-xl px-4 py-2 text-sm font-bold border transition',
                size === s ? sizeActiveBtn : sizeIdleBtn,
              ].join(' ')}
            >
              {SIZE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className={previewBar}>
          <span className={previewLabel}>{t('preview')}</span>
          {['chatgpt', 'claude', 'deepseek'].map((pid) => {
            const p = portals.find((x) => x.id === pid);
            if (!p) return null;
            const sz = SIZE_MAP[size];
            return (
              <div key={pid} className={`flex items-center ${sz.gap} ${sz.btn} ${previewItem} ${sz.px} ${sz.py}`}>
                <PortalIcon icon={p.icon} url={p.url} name={p.name} size={sz.img} />
                <span className={`whitespace-nowrap ${sz.text} font-bold ${previewItemText}`}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={card}>
        <h4 className={heading}>{t('aiPortalList')}</h4>
        <div className="grid gap-2">
          {portals.map((portal) => (
            <div key={portal.id} className={rowBg}>
              <button
                type="button"
                onClick={() => toggle(portal.id)}
                className={['h-5 w-9 rounded-full transition', portal.enabled ? toggleOn : toggleOff].join(' ')}
                title={portal.enabled ? t('disable') : t('enable')}
              >
                <span className={['block h-4 w-4 rounded-full bg-white shadow transition-all', portal.enabled ? 'ml-[18px]' : 'ml-0.5'].join(' ')} />
              </button>
              <div className="flex items-center gap-1">
                <div className={iconThumb}>
                  <PortalIcon icon={portal.icon} url={portal.url} name={portal.name} size={18} />
                </div>
                <input
                  value={portal.icon === 'auto' ? '' : portal.icon}
                  onChange={(e) => updateField(portal.id, 'icon', e.target.value.trim() || 'auto')}
                  className={`w-20 ${inputCls}`}
                  placeholder={t('iconUrlAuto')}
                  title={t('iconUrlHint')}
                />
              </div>
              <input
                value={portal.name}
                onChange={(e) => updateField(portal.id, 'name', e.target.value)}
                className={`w-24 ${inputCls}`}
              />
              <input
                value={portal.url}
                onChange={(e) => updateField(portal.id, 'url', e.target.value)}
                className={`min-w-0 flex-1 ${inputCls}`}
              />
              {!portal.builtIn && (
                <button type="button" onClick={() => remove(portal.id)} className={removeBtn}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h4 className={heading}>{t('addCustomAiPortal')}</h4>
        <div className="flex flex-wrap gap-2">
          <input
            value={form.icon === 'auto' ? '' : form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value.trim() || 'auto' })}
            placeholder={t('iconUrl')}
            className={`w-24 ${addInput}`}
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('name')}
            className={addInputMd}
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
            className={addInputFlex}
          />
          <button
            type="button"
            onClick={addPortal}
            disabled={!form.name.trim() || !form.url.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />{t('add')}
          </button>
        </div>
        <p className={hintText}>{t('iconUrlHint')}</p>
      </div>
    </div>
  );
}
