import { Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AppShortcut } from '../types';
import type { TranslationKey } from '../i18n';

type ShortcutEditorProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialApp: AppShortcut | null;
  folderId: string | null;
  t: (key: TranslationKey) => string;
  onSave: (shortcut: Pick<AppShortcut, 'name' | 'url' | 'folderId' | 'iconType' | 'iconValue' | 'iconColor'>) => void;
  onClose: () => void;
};

export function ShortcutEditor({ open, mode, initialApp, folderId, t, onSave, onClose }: ShortcutEditorProps) {
  const [name, setName]         = useState(initialApp?.name ?? '');
  const [url, setUrl]           = useState(initialApp?.url ?? '');
  const [iconValue, setIconValue] = useState(initialApp?.iconType === 'custom' ? (initialApp.iconValue ?? '') : '');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialApp?.name ?? '');
      setUrl(initialApp?.url ?? '');
      setIconValue(initialApp?.iconType === 'custom' ? (initialApp.iconValue ?? '') : '');
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initialApp]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim() || !url.trim()) return;
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    onSave({
      name: name.trim(),
      url: normalized,
      folderId: initialApp?.folderId ?? folderId,
      iconType: iconValue ? 'custom' : 'api',
      iconValue: iconValue || new URL(normalized).hostname,
      iconColor: initialApp?.iconColor ?? '',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl p-6 shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)' }}
      >
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-black text-slate-800">
            {mode === 'add' ? t('addWebsite') : t('editWebsite')}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl bg-black/6 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-black/10"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="rounded-xl bg-black/6 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-black/10"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <input
            value={iconValue}
            onChange={(e) => setIconValue(e.target.value)}
            placeholder="Custom icon URL (optional)"
            className="rounded-xl bg-black/6 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-black/10"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-black/6">{t('cancel')}</button>
          <button
            type="button" onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
