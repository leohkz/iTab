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

  // Shared input class — explicit text-slate-950 ensures readable text on any bg
  const inputClass = 'mt-2 h-11 w-full rounded-xl border border-slate-950/10 bg-white px-3 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950/30';

  return (
    <div
      className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'add' ? t('addWebsite') : t('editWebsite')}
        className="w-[min(30rem,calc(100vw-2rem))] rounded-[1.55rem] border border-white/40 bg-white/92 p-5 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.34)] backdrop-blur-2xl"
        data-testid="modal-shortcut-editor"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{t('shortcut')}</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">{mode === 'add' ? t('addWebsite') : t('editWebsite')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancel')}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-950/8 text-slate-600"
            data-testid="button-close-shortcut-editor"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <label className="block text-sm font-black text-slate-700">
          {t('name')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Claude"
            data-testid="input-shortcut-name"
          />
        </label>

        <label className="mt-4 block text-sm font-black text-slate-700">
          {t('url')}
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            className={inputClass}
            placeholder="https://claude.ai"
            data-testid="input-shortcut-url"
          />
        </label>

        <label className="mt-4 block text-sm font-black text-slate-700">
          {t('customIconUrl')}
          <input
            value={iconValue}
            onChange={(e) => setIconValue(e.target.value)}
            className={inputClass}
            placeholder="https://example.com/icon.png"
            data-testid="input-shortcut-icon"
          />
        </label>

        <label className="mt-4 flex items-center justify-between gap-4 text-sm font-black text-slate-700">
          <span>
            {t('iconColor')}
            <span className="mt-1 block text-xs font-semibold text-slate-500">{t('iconColorDesc')}</span>
          </span>
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={iconColor || '#7dd3fc'}
              onChange={(e) => setIconColor(e.target.value)}
              className="h-10 w-16 rounded-xl border border-slate-950/10 bg-white p-1"
              data-testid="input-shortcut-icon-color"
            />
            <button
              type="button"
              onClick={() => setIconColor('')}
              className="h-10 rounded-xl bg-slate-950/8 px-3 text-xs font-black text-slate-700"
              data-testid="button-auto-icon-color"
            >
              Auto
            </button>
          </span>
        </label>

        <button
          type="button"
          onClick={submit}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition duration-200 hover:bg-slate-800 active:scale-[0.99]"
          data-testid="button-save-shortcut"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {mode === 'add' ? t('addToGrid') : t('saveChanges')}
        </button>
      </section>
    </div>
  );
}
