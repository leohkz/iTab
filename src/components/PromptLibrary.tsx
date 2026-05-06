import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { Prompt } from '../types';
import { PromptEditor } from './PromptEditor';

type Props = {
  prompts: Prompt[];
  glass: number;
  t: (key: string) => string;
  onClose: () => void;
  onAdd: (data: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onEdit: (id: string, data: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
};

function glassStyle(glass: number) {
  const alpha = Math.min(0.85, Math.max(0.6, glass / 100));
  const blur  = Math.round(12 + glass / 8);
  return {
    backgroundColor: `rgba(255,255,255,${alpha})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
  };
}

export function PromptLibrary({ prompts, glass, t, onClose, onAdd, onEdit, onDelete }: Props) {
  const [search, setSearch]     = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing]   = useState<Prompt | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  // Collect unique tags (tags are plain strings)
  const allTags: string[] = [];
  const seen = new Set<string>();
  prompts.forEach((p) => {
    p.tags.forEach((tag) => {
      if (tag.trim() && !seen.has(tag)) {
        seen.add(tag);
        allTags.push(tag);
      }
    });
  });

  let list = [...prompts];
  if (activeTag) list = list.filter((p) => p.tags.includes(activeTag));
  const q = search.trim().toLowerCase();
  if (q) list = list.filter((p) =>
    p.title.toLowerCase().includes(q) ||
    p.content.toLowerCase().includes(q) ||
    p.tags.some((tag) => tag.toLowerCase().includes(q)),
  );

  const copyPrompt = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <>
      <aside
        className="fixed inset-y-0 left-16 z-30 flex w-[26rem] flex-col overflow-hidden rounded-r-3xl border-r border-black/8 shadow-2xl"
        style={glassStyle(glass)}
        aria-label="Prompt Library"
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-black/8 px-4 py-3">
          <p className="flex-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            {t('promptLibrary')}
          </p>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowEditor(true); }}
            className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-black/8 hover:text-slate-800"
            aria-label={t('newPrompt')}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-black/8 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border-b border-black/8 px-4 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPrompts')}
            className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto border-b border-black/8 px-4 py-2 scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={['shrink-0 rounded-full px-3 py-1 text-xs font-bold transition', !activeTag ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-black/8'].join(' ')}
            >
              {t('allTags')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={['shrink-0 rounded-full px-3 py-1 text-xs font-bold transition', activeTag === tag ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-black/8'].join(' ')}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Prompt list */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">{t('noPrompts')}</p>
          )}
          {list.map((prompt) => (
            <div
              key={prompt.id}
              className="group relative overflow-hidden rounded-2xl border border-black/6 bg-white/60 p-4 shadow-sm transition hover:shadow-md"
            >
              {prompt.imageUrl && (
                <img src={prompt.imageUrl} alt="" className="mb-3 h-24 w-full rounded-xl object-cover" />
              )}
              <p className="mb-1 text-sm font-black text-slate-800">{prompt.title}</p>
              <p className="mb-3 line-clamp-2 text-xs text-slate-500">{prompt.content}</p>

              {/* Tags */}
              {prompt.tags.filter((tag) => tag.trim()).length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {prompt.tags.filter((tag) => tag.trim()).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
                      style={{ backgroundColor: 'rgba(0,0,0,0.07)', color: '#475569' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyPrompt(prompt.id, prompt.content)}
                  className="flex-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                >
                  {copied === prompt.id ? t('copied') : t('copyPrompt')}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(prompt); setShowEditor(true); }}
                  className="rounded-xl bg-black/8 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-black/12"
                >
                  {t('edit')}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(prompt.id)}
                  className="rounded-xl bg-black/8 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {showEditor && (
        <PromptEditor
          initial={editing}
          onSave={(data) => {
            if (editing) onEdit(editing.id, data);
            else onAdd(data);
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
