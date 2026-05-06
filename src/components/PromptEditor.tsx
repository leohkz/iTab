import { X } from 'lucide-react';
import { useState } from 'react';
import type { Prompt } from '../types';
import type { TranslationKey } from '../i18n';

type PromptEditorProps = {
  open: boolean;
  initial: Prompt | null;
  t: (key: TranslationKey) => string;
  onSave: (p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
};

export function PromptEditor({ open, initial, t, onSave, onClose }: PromptEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(', '));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    onSave({ title: title.trim(), content: content.trim(), tags, imageUrl: imageUrl.trim() || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-800">
            {initial ? t('editPrompt') : t('newPrompt')}
          </h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptTitle')}</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blog Post Writer"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptContent')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Write your prompt here…"
            className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-relaxed text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptTags')}</label>
          <input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="writing, coding, marketing"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptImageUrl')}</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
          />
          {imageUrl && (
            <img src={imageUrl} alt="preview" className="mt-1 h-24 w-full rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-black text-white hover:bg-slate-700 disabled:opacity-40"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
