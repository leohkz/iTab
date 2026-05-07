import { X } from 'lucide-react';
import { useState } from 'react';
import type { Prompt, PromptTag } from '../types';
import type { TranslationKey } from '../i18n';

// 12 preset colours for quick pick
const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#f97316',
  '#14b8a6', '#84cc16', '#0ea5e9', '#a855f7',
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function tagTextColor(bg: string) {
  return hexToRgb(bg) > 128 ? '#1e293b' : '#ffffff';
}

type TagInputProps = {
  tags: PromptTag[];
  existingTags: PromptTag[];   // all tags already in the library
  onChange: (tags: PromptTag[]) => void;
  placeholder: string;
};

function TagInput({ tags, existingTags, onChange, placeholder }: TagInputProps) {
  const [inputVal, setInputVal] = useState('');
  const [pickColor, setPickColor] = useState(PRESET_COLORS[0]);

  const addTag = () => {
    const label = inputVal.trim();
    if (!label) return;
    if (tags.some((t) => t.label === label)) { setInputVal(''); return; }
    onChange([...tags, { label, color: pickColor }]);
    setInputVal('');
  };

  const removeTag = (label: string) => onChange(tags.filter((t) => t.label !== label));

  const toggleExisting = (tag: PromptTag) => {
    const already = tags.some((t) => t.label === tag.label);
    if (already) {
      removeTag(tag.label);
    } else {
      onChange([...tags, tag]);
    }
  };

  // Only show library tags that are not already in the "active" list as suggestions,
  // but show ALL library tags so user can toggle any of them.
  // We deduplicate by label.
  const libraryTags = existingTags.filter(
    (et, idx, arr) => arr.findIndex((x) => x.label === et.label) === idx,
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Currently selected tags */}
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

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700"
        >
          +
        </button>
      </div>

      {/* Colour preset swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setPickColor(c)}
            className="h-5 w-5 rounded-full border-2 transition"
            style={{
              backgroundColor: c,
              borderColor: pickColor === c ? '#0f172a' : 'transparent',
              transform: pickColor === c ? 'scale(1.2)' : 'scale(1)',
            }}
            aria-label={c}
          />
        ))}
        {/* Custom hex input */}
        <input
          type="color"
          value={pickColor}
          onChange={(e) => setPickColor(e.target.value)}
          className="h-5 w-5 cursor-pointer rounded-full border-0 p-0"
          title="Custom colour"
        />
      </div>

      {/* Existing library tags — click to toggle */}
      {libraryTags.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
          <p className="mb-1.5 text-[0.6rem] font-black uppercase tracking-widest text-slate-400">已有標籤</p>
          <div className="flex flex-wrap gap-1.5">
            {libraryTags.map((tag) => {
              const active = tags.some((t) => t.label === tag.label);
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => toggleExisting(tag)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black transition"
                  style={{
                    backgroundColor: active ? tag.color : `${tag.color}28`,
                    color: active ? tagTextColor(tag.color) : tag.color,
                    border: `1.5px solid ${tag.color}`,
                    opacity: 1,
                  }}
                  title={active ? '點擊移除' : '點擊加入'}
                >
                  {active ? '✓ ' : '+ '}{tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type PromptEditorProps = {
  open: boolean;
  initial: Prompt | null;
  allTags: PromptTag[];   // all tags from the library
  t: (key: TranslationKey) => string;
  onSave: (p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
};

export function PromptEditor({ open, initial, allTags, t, onSave, onClose }: PromptEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tags, setTags] = useState<PromptTag[]>(initial?.tags ?? []);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), tags, imageUrl: imageUrl.trim() || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.18s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-2xl"
        style={{ animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '90vh', overflowY: 'auto' }}
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
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blog Post Writer"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
          />
        </div>

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

        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('promptTags')}</label>
          <TagInput
            tags={tags}
            existingTags={allTags}
            onChange={setTags}
            placeholder="coding, writing…"
          />
        </div>

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
