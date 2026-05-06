import { useEffect, useRef, useState } from 'react';
import type { Prompt } from '../types';

type Props = {
  initial?: Prompt | null;
  onSave: (data: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onClose: () => void;
};

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
];

export function PromptEditor({ initial, onSave, onClose }: Props) {
  const [title, setTitle]       = useState(initial?.title ?? '');
  const [content, setContent]   = useState(initial?.content ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [tags, setTags]         = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const addTag = () => {
    const label = tagInput.trim();
    if (!label || tags.includes(label)) return;
    setTags([...tags, label]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content,
      imageUrl: imageUrl.trim() || undefined,
      tags: tags.filter((t) => t.trim()),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-3xl p-6 shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)' }}
      >
        <h2 className="text-base font-black text-slate-800">
          {initial ? '編輯 Prompt' : '新增 Prompt'}
        </h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">標題</label>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prompt 標題…"
            className="rounded-xl bg-black/6 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-black/10"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">內容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="輸入 Prompt 內容…"
            className="resize-none rounded-xl bg-black/6 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-black/10"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">預覽圖片網址（選填）</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-xl bg-black/6 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-black/10"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">標籤</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ backgroundColor: tagColor + '22', color: tagColor, border: `1px solid ${tagColor}55` }}
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-current opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => setTagColor(c)}
                  className={['h-5 w-5 rounded-full transition', tagColor === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''].join(' ')}
                  style={{ background: c }}
                />
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="新增標籤…"
              className="flex-1 rounded-xl bg-black/6 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-black/10"
            />
            <button type="button" onClick={addTag} className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700">新增</button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-black/6">取消</button>
          <button type="button" onClick={handleSave} disabled={!title.trim()} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-40">儲存</button>
        </div>
      </div>
    </div>
  );
}
