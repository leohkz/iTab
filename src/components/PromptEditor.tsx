import { X } from 'lucide-react';
import { useState } from 'react';
import type { Prompt, PromptTag } from '../types';
import type { TranslationKey } from '../i18n';

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#f97316',
  '#14b8a6', '#84cc16', '#0ea5e9', '#a855f7',
];

function hexLuminance(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
function tagTextColor(bg: string) {
  return hexLuminance(bg) > 128 ? '#1e293b' : '#ffffff';
}

type TagInputProps = {
  tags: PromptTag[];
  existingTags: PromptTag[];   // all tags from library for quick-pick
  onChange: (tags: PromptTag[]) => void;
};

function TagInput({ tags, existingTags, onChange }: TagInputProps) {
  const [inputVal, setInputVal] = useState('');
  const [pickColor, setPickColor] = useState(PRESET_COLORS[0]);

  const hasLabel = (label: string) => tags.some((t) => t.label === label);

  const addTag = (label = inputVal, color = pickColor) => {
    const trimmed = label.trim();
    if (!trimmed) return;                      // guard: skip empty labels
    if (hasLabel(trimmed)) { setInputVal(''); return; }
    onChange([...tags, { label: trimmed, color }]);
    setInputVal('');
  };

  const removeTag = (label: string) => onChange(tags.filter((t) => t.label !== label));

  // Existing tags not yet added to this prompt
  const quickPick = existingTags.filter((t) => t.label.trim() && !hasLabel(t.label));

  return (
    <div className="flex flex-col gap-2">
      {/* Current tags on this prompt */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black"
              style={{ backgroundColor: tag.color, color: tagTextColor(tag.color) }}
            >
              {tag.label}
              <button type="button" onClick={() => removeTag(tag.label)} className="opacity-70 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick-pick existing tags */}
      {quickPick.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickPick.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => addTag(tag.label, tag.color)}
              className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black transition hover:opacity-80"
              style={{
                backgroundColor: `${tag.color}1a`,
                borderColor: `${tag.color}88`,
                color: tag.color,
              }}
            >
              + {tag.label}
            </button>
          ))}
        </div>
      )}

      {/* New tag input row */}
      <div className="flex items-center gap-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="輸入新 tag…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={() => addTag()}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700"
        >
          +
        </button>
      </div>

      {/* Colour swatches for new tag */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c} type="button" onClick={() => setPickColor(c)}
            className="h-5 w-5 rounded-full border-2 transition"
            style={{
              backgroundColor: c,
              borderColor: pickColor === c ? '#0f172a' : 'transparent',
              transform: pickColor === c ? 'scale(1.2)' : 'scale(1)',
            }}
            aria-label={c}
          />
        ))}
        <input
          type="color" value={pickColor}
          onChange={(e) => setPickColor(e.target.value)}
          className="h-5 w-5 cursor-pointer rounded-full border-0 p-0"
          title="Custom colour"
        />
      </div>
    </div>
  );
}

// ── Inner form ──
type FormProps = {
  initial: Prompt | null;
  existingTags: PromptTag[];
  t: (key: TranslationKey) => string;
  onSave: (p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
};

function PromptEditorForm({ initial, existingTags, t, onSave, onClose }: FormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tags, setTags] = useState<PromptTag[]>(
    // filter out any legacy empty-label tags
    (initial?.tags ?? []).filter((tag) => tag.label.trim()),
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      tags: tags.filter((t) => t.label.trim()),  // extra safety
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.18s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"
        style={{ maxHeight: 'calc(100dvh - 3rem)', animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-800">
            {initial ? t('editPrompt') : t('newPrompt')}
          </h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptTitle')}</label>
          <input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blog Post Writer"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptContent')}</label>
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)}
            rows={6} placeholder="Write your prompt here…"
            className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold leading-relaxed text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptTags')}</label>
          <TagInput tags={tags} existingTags={existingTags} onChange={setTags} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptImageUrl')}</label>
          <input
            value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
          />
          {imageUrl && (
            <img src={imageUrl} alt="preview" className="mt-1 h-24 w-full rounded-xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
            {t('cancel')}
          </button>
          <button
            type="button" onClick={handleSave}
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

// ── Public wrapper ──
export type PromptEditorProps = {
  open: boolean;
  initial: Prompt | null;
  existingTags: PromptTag[];
  t: (key: TranslationKey) => string;
  onSave: (p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
};

export function PromptEditor({ open, initial, existingTags, t, onSave, onClose }: PromptEditorProps) {
  if (!open) return null;
  return (
    <PromptEditorForm
      key={initial?.id ?? 'new'}
      initial={initial}
      existingTags={existingTags}
      t={t}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
