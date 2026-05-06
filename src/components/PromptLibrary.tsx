import { Check, Copy, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Prompt } from '../types';
import type { TranslationKey } from '../i18n';
import { PromptEditor } from './PromptEditor';

type PromptLibraryProps = {
  prompts: Prompt[];
  glass: number;
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onAdd: (p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onEdit: (id: string, p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
};

function PromptCard({
  prompt, t,
  onEdit, onDelete,
}: {
  prompt: Prompt;
  t: (key: TranslationKey) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-white/30 bg-white/72 shadow-[0_4px_24px_rgba(15,23,42,0.10)] backdrop-blur-md transition hover:shadow-[0_8px_32px_rgba(15,23,42,0.18)] hover:-translate-y-0.5">
      {/* Image preview */}
      {prompt.imageUrl ? (
        <img
          src={prompt.imageUrl}
          alt={prompt.title}
          className="h-32 w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <span className="text-3xl opacity-30">✨</span>
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-black text-slate-800 leading-tight">{prompt.title}</h3>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content preview */}
        <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">{prompt.content}</p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
            aria-label="Edit prompt"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Delete prompt"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={[
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition',
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-900 text-white hover:bg-slate-700',
          ].join(' ')}
          aria-label={t('copyPrompt')}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? t('copied') : t('copyPrompt')}
        </button>
      </div>
    </div>
  );
}

export function PromptLibrary({ prompts, glass: _glass, t, onClose, onAdd, onEdit, onDelete }: PromptLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [prompts]);

  const filtered = useMemo(() => {
    let list = prompts;
    if (activeTag) list = list.filter((p) => p.tags.includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [prompts, activeTag, search]);

  const openAdd = () => { setEditingPrompt(null); setEditorOpen(true); };
  const openEdit = (p: Prompt) => { setEditingPrompt(p); setEditorOpen(true); };

  return (
    <>
      {/* 左側滑入覆層面板 */}
      <div className="fixed inset-0 z-[60] flex">
        {/* 左側內容區 */}
        <div
          className="relative flex h-full w-full max-w-6xl flex-col bg-white/12 backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <h1 className="text-lg font-black text-white">{t('promptLibrary')}</h1>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black text-white/80">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAdd}
                className="flex items-center gap-1.5 rounded-full bg-white text-slate-900 px-4 py-1.5 text-sm font-black shadow transition hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                {t('newPrompt')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search + Tag filter */}
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/15 px-6 py-3">
            <div className="flex min-w-[14rem] items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-white/70 backdrop-blur">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPrompts')}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/50"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="shrink-0 text-white/50 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Tag pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={['flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black transition', activeTag === null ? 'bg-white text-slate-900' : 'bg-white/20 text-white hover:bg-white/30'].join(' ')}
              >
                {t('allTags')}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={['flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black transition', activeTag === tag ? 'bg-white text-slate-900' : 'bg-white/20 text-white hover:bg-white/30'].join(' ')}
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {filtered.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm font-bold text-white/50">
                {t('noPrompts')}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((p) => (
                  <PromptCard
                    key={p.id}
                    prompt={p}
                    t={t}
                    onEdit={() => openEdit(p)}
                    onDelete={() => onDelete(p.id)}
                  />
                ))}
                {/* Add new card */}
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-[1.4rem] border-2 border-dashed border-white/30 text-white/50 transition hover:border-white/60 hover:text-white/80"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-xs font-black">{t('newPrompt')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 点擊右側空白關閉 */}
        <div className="flex-1" onClick={onClose} />
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <PromptEditor
          open={editorOpen}
          initial={editingPrompt}
          t={t}
          onSave={(data) => {
            if (editingPrompt) {
              onEdit(editingPrompt.id, data);
            } else {
              onAdd(data);
            }
            setEditorOpen(false);
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  );
}
