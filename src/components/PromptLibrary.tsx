import { Check, Copy, Eye, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Prompt, PromptTag } from '../types';
import type { TranslationKey } from '../i18n';
import { PromptEditor } from './PromptEditor';

// ── helpers ──────────────────────────────────────────────────────────────────
function hexLuminance(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
function tagTextColor(bg: string) {
  return hexLuminance(bg) > 128 ? '#1e293b' : '#ffffff';
}

// ── Delete confirm dialog ────────────────────────────────────────────────────
function DeleteConfirm({ title, t, onConfirm, onCancel }: {
  title: string;
  t: (k: TranslationKey) => string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-80 rounded-[1.6rem] bg-white p-6 shadow-2xl"
        style={{ animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <p className="mb-1 text-base font-black text-slate-800">{t('delete')} Prompt?</p>
        <p className="mb-5 text-sm text-slate-500 line-clamp-2">&ldquo;{title}&rdquo;</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
            {t('cancel')}
          </button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white hover:bg-red-600">
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Image Preview Modal ───────────────────────────────────────────────────────
function PreviewModal({ prompt, t, onClose }: {
  prompt: Prompt;
  t: (k: TranslationKey) => string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.18s ease' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative mx-4 flex w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_32px_96px_rgba(15,23,42,0.45)]"
        style={{ maxHeight: '88vh', animation: 'slideUp 0.22s cubic-bezier(0.34,1.3,0.64,1)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left — image */}
        <div className="flex w-1/2 shrink-0 items-center justify-center bg-slate-950 p-4">
          <img
            src={prompt.imageUrl}
            alt={prompt.title}
            className="max-h-full max-w-full rounded-xl object-contain"
            style={{ maxHeight: 'calc(88vh - 2rem)' }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              (el.parentElement as HTMLElement).innerHTML =
                '<span style="color:rgba(255,255,255,0.3);font-size:2rem;">🖼️</span>';
            }}
          />
        </div>

        {/* Right — prompt info */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight mb-2">{prompt.title}</h2>
            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide"
                    style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}55` }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 rounded-2xl bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 select-text">
              {prompt.content}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={[
              'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition',
              copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-700',
            ].join(' ')}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t('copied') : t('copyPrompt')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tag pill ─────────────────────────────────────────────────────────────────
function TagPill({ tag, active, onClick }: { tag: PromptTag; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black transition"
      style={{
        backgroundColor: active ? tag.color : `${tag.color}33`,
        color: active ? tagTextColor(tag.color) : tag.color,
        border: `1.5px solid ${tag.color}`,
        outline: active ? `2px solid ${tag.color}` : 'none',
        outlineOffset: '1px',
      }}
    >
      <Tag className="h-2.5 w-2.5" />
      {tag.label}
    </button>
  );
}

// ── Prompt Card ──────────────────────────────────────────────────────────────
function PromptCard({
  prompt, t, onEdit, onDeleteRequest, onPreview,
}: {
  prompt: Prompt;
  t: (key: TranslationKey) => string;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onPreview: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(15,23,42,0.16)]"
      style={{ animation: 'fadeInUp 0.28s ease both' }}
    >
      {prompt.imageUrl ? (
        <div className="relative h-32 w-full overflow-hidden cursor-pointer" onClick={onPreview}>
          <img
            src={prompt.imageUrl}
            alt={prompt.title}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              (el.parentElement as HTMLElement).classList.add(
                'flex', 'items-center', 'justify-center',
                'bg-gradient-to-br', 'from-slate-100', 'to-slate-200',
              );
              (el.parentElement as HTMLElement).innerHTML = '<span style="font-size:1.5rem;opacity:0.3">✨</span>';
            }}
          />
          {/* hover overlay hint */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-200 group-hover:bg-black/20">
            <Eye className="h-7 w-7 text-white opacity-0 drop-shadow transition duration-200 group-hover:opacity-100" />
          </div>
        </div>
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <span className="text-3xl opacity-25">✨</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-black leading-tight text-slate-900">{prompt.title}</h3>
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <span
                key={tag.label}
                className="rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide"
                style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}55` }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        <p className="line-clamp-3 text-xs font-medium leading-relaxed text-slate-700">{prompt.content}</p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <div className="flex gap-1">
          <button
            type="button" onClick={onEdit}
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button" onClick={onDeleteRequest}
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {/* Preview button — only shown when imageUrl is present */}
          {prompt.imageUrl && (
            <button
              type="button" onClick={onPreview}
              className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-violet-50 hover:text-violet-600"
              aria-label="Preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button" onClick={handleCopy}
          className={['flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition', copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'].join(' ')}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? t('copied') : t('copyPrompt')}
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
type PromptLibraryProps = {
  prompts: Prompt[];
  glass: number;
  t: (key: TranslationKey) => string;
  onClose: () => void;
  onAdd: (p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onEdit: (id: string, p: Omit<Prompt, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
};

export function PromptLibrary({ prompts, glass, t, onClose, onAdd, onEdit, onDelete }: PromptLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);

  const panelAlpha = Math.min(0.98, Math.max(0.82, glass / 100));
  const panelBlur  = Math.round(8 + glass / 8);
  const panelStyle: React.CSSProperties = {
    background: `rgba(255,255,255,${panelAlpha})`,
    backdropFilter: `blur(${panelBlur}px)`,
    WebkitBackdropFilter: `blur(${panelBlur}px)`,
  };

  const allTags = useMemo(() => {
    const map = new Map<string, PromptTag>();
    prompts.forEach((p) => p.tags.forEach((tag) => { if (!map.has(tag.label)) map.set(tag.label, tag); }));
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [prompts]);

  const filtered = useMemo(() => {
    let list = prompts;
    if (activeTag) list = list.filter((p) => p.tags.some((tag) => tag.label === activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.label.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [prompts, activeTag, search]);

  const openAdd = () => { setEditingPrompt(null); setEditorOpen(true); };
  const openEdit = (p: Prompt) => { setEditingPrompt(p); setEditorOpen(true); };
  const deletingPrompt = prompts.find((p) => p.id === deletingId) ?? null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-md"
        style={{ animation: 'fadeIn 0.2s ease' }}
        onClick={onClose}
      />

      <div
        className="fixed inset-x-4 bottom-4 top-20 z-[61] flex flex-col overflow-hidden rounded-[2rem] border border-white/25 shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
        style={{ ...panelStyle, animation: 'slideUp 0.28s cubic-bezier(0.34,1.3,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <h1 className="text-base font-black text-slate-900">{t('promptLibrary')}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={openAdd}
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-black text-white shadow transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />{t('newPrompt')}
            </button>
            <button
              type="button" onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-3">
          <div className="flex min-w-[14rem] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-400">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPrompts')}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
            />
            {search && <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={['rounded-full px-3 py-1 text-xs font-black transition', activeTag === null ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'].join(' ')}
          >
            {t('allTags')}
          </button>
          {allTags.map((tag) => (
            <TagPill
              key={tag.label}
              tag={tag}
              active={activeTag === tag.label}
              onClick={() => setActiveTag(activeTag === tag.label ? null : tag.label)}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm font-bold text-slate-400">{t('noPrompts')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((p) => (
                <PromptCard
                  key={p.id} prompt={p} t={t}
                  onEdit={() => openEdit(p)}
                  onDeleteRequest={() => setDeletingId(p.id)}
                  onPreview={() => setPreviewPrompt(p)}
                />
              ))}
              <button
                type="button" onClick={openAdd}
                className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-[1.4rem] border-2 border-dashed border-slate-200 text-slate-300 transition hover:border-slate-400 hover:text-slate-500"
              >
                <Plus className="h-8 w-8" />
                <span className="text-xs font-black">{t('newPrompt')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewPrompt && (
        <PreviewModal
          prompt={previewPrompt}
          t={t}
          onClose={() => setPreviewPrompt(null)}
        />
      )}

      {deletingPrompt && (
        <DeleteConfirm
          title={deletingPrompt.title}
          t={t}
          onConfirm={() => { onDelete(deletingId!); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {editorOpen && (
        <PromptEditor
          open={editorOpen}
          initial={editingPrompt}
          t={t}
          onSave={(data) => {
            if (editingPrompt) onEdit(editingPrompt.id, data); else onAdd(data);
            setEditorOpen(false);
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(32px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  );
}
