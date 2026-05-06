import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppShortcut } from '../types';
import type { TranslationKey } from '../i18n';

type ShortcutEditorProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialApp?: AppShortcut | null;
  folderId?: string | null;
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onSave: (shortcut: Pick<AppShortcut, 'name' | 'url' | 'folderId' | 'iconType' | 'iconValue' | 'iconColor'>) => void;
};

export function ShortcutEditor({ open, mode, initialApp, folderId = null, t, onClose, onSave }: ShortcutEditorProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [iconValue, setIconValue] = useState('');
  const [iconColor, setIconColor] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialApp?.name ?? '');
      setUrl(initialApp?.url ?? '');
      setIconValue(initialApp?.iconType === 'custom' ? initialApp.iconValue : '');
      setIconColor(initialApp?.iconColor ?? '');
    }
  }, [initialApp, open]);

  if (!open) return null;

  const submit = () => {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    if (!name.trim() || !url.trim()) return;
    onSave({
      name: name.trim(),
      url: normalizedUrl,
      folderId: initialApp?.folderId ?? folderId,
      iconType: iconValue.trim() ? 'custom' : 'api',
      iconValue: iconValue.trim() || normalizedUrl,
      iconColor: iconColor || undefined,
    });
    onClose();
  };

  const inputClass = 'mt-2 h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:border-white/35 focus:bg-white/15 transition';

  return (
    <div
      className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'add' ? t('addWebsite') : t('editWebsite')}
        className="w-[min(30rem,calc(100vw-2rem))] rounded-[1.55rem] border border-white/20 bg-slate-900/88 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-2xl"
        data-testid="modal-shortcut-editor"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">{t('shortcut')}</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.05em] text-white">
              {mode === 'add' ? t('addWebsite') : t('editWebsite')}
            </h2>
          </div>
          <button
            type="button" onClick={onClose} aria-label={t('cancel')}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-white/70 hover:bg-white/20 transition"
            data-testid="button-close-shortcut-editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name */}
        <label className="block text-sm font-black text-white">
          {t('name')}
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={inputClass} placeholder="Claude"
            data-testid="input-shortcut-name" />
        </label>

        {/* URL */}
        <label className="mt-4 block text-sm font-black text-white">
          {t('url')}
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            className={inputClass} placeholder="https://claude.ai"
            data-testid="input-shortcut-url" />
        </label>

        {/* Custom icon URL */}
        <label className="mt-4 block text-sm font-black text-white">
          {t('customIconUrl')}
          <input value={iconValue} onChange={(e) => setIconValue(e.target.value)}
            className={inputClass} placeholder="https://example.com/icon.png"
            data-testid="input-shortcut-icon" />
        </label>

        {/* Icon colour */}
        <label className="mt-4 flex items-center justify-between gap-4 text-sm font-black text-white">
          <span>
            {t('iconColor')}
            <span className="mt-1 block text-xs font-semibold text-white/50">{t('iconColorDesc')}</span>
          </span>
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={iconColor || '#7dd3fc'}
              onChange={(e) => setIconColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-xl border border-white/15 bg-white/10 p-1"
              data-testid="input-shortcut-icon-color"
            />
            <button
              type="button" onClick={() => setIconColor('')}
              className="h-10 rounded-xl bg-white/12 px-3 text-xs font-black text-white hover:bg-white/20 transition"
              data-testid="button-auto-icon-color"
            >
              Auto
            </button>
          </span>
        </label>

        {/* Save */}
        <button
          type="button" onClick={submit}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-slate-950 transition duration-200 hover:bg-white/90 active:scale-[0.99]"
          data-testid="button-save-shortcut"
        >
          <Plus className="h-4 w-4" />
          {mode === 'add' ? t('addToGrid') : t('saveChanges')}
        </button>
      </section>
    </div>
  );
}
