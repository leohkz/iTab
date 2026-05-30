import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import type { AiPortal, AppConfig, AppShortcut, Prompt, PromptTag, Space } from './types';
import { DEFAULT_AI_PORTALS } from './types';

const CONFIG_KEY = 'workspace-new-tab-config';

function getFaviconUrl(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return ''; }
}

// ── Prompt row item ───────────────────────────────────────────────────────────
function PromptItem({ prompt, onPreview }: { prompt: Prompt; onPreview: () => void }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasImage = !!prompt.imageUrl && !imgError;

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}>
      {/* Thumbnail — always clickable */}
      <div
        onClick={onPreview}
        style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          overflow: 'hidden', cursor: 'pointer',
          background: 'linear-gradient(135deg,#334155,#475569)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {hasImage ? (
          <img src={prompt.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
        ) : (
          <span style={{ fontSize: 18, opacity: 0.5 }}>✨</span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {prompt.title}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
          {prompt.content}
        </div>
        {prompt.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
            {prompt.tags.slice(0, 3).map((tag, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: tag.color + '33', color: tag.color }}>{tag.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Copy button */}
      <button onClick={copy} style={{
        flexShrink: 0, padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontSize: 11, fontWeight: 700,
        background: copied ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)',
        color: copied ? '#86efac' : '#cbd5e1', transition: 'all 0.2s',
      }}>
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  );
}

// ── Shortcut item ─────────────────────────────────────────────────────────────
function ShortcutItem({ name, url }: { name: string; url: string }) {
  return (
    <button
      onClick={() => chrome.tabs.create({ url })}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '10px 6px', background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
        cursor: 'pointer', color: '#f1f5f9', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
    >
      <img src={getFaviconUrl(url)} width={22} height={22} style={{ borderRadius: 5 }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
        maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </button>
  );
}

// ── Inline Preview Modal ─────────────────────────────────────────────────────
function PreviewModal({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasImage = !!prompt.imageUrl && !imgError;

  const copy = () => navigator.clipboard.writeText(prompt.content).then(() => {
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 320, maxHeight: 500, borderRadius: 20,
          background: '#1e293b', color: '#f1f5f9',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasImage ? (
          <img src={prompt.imageUrl} alt={prompt.title}
            style={{ width: '100%', height: 130, objectFit: 'cover' }}
            onError={() => setImgError(true)} />
        ) : (
          <div style={{ height: 70, background: 'linear-gradient(135deg,#334155,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, opacity: 0.3 }}>✨</span>
          </div>
        )}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: '#fff', lineHeight: 1.3 }}>{prompt.title}</span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 24, height: 24, cursor: 'pointer', color: '#94a3b8', fontSize: 13, flexShrink: 0 }}>✕</button>
          </div>
          {prompt.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {prompt.tags.map((tag, i) => (
                <span key={i} style={{ padding: '1px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: tag.color + '33', color: tag.color }}>{tag.label}</span>
              ))}
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '9px 11px', flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', userSelect: 'text' }}>{prompt.content}</p>
          </div>
          <button onClick={copy} style={{
            padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 12,
            background: copied ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.12)',
            color: copied ? '#86efac' : '#f1f5f9', transition: 'all 0.2s',
          }}>
            {copied ? '✓ Copied!' : 'Copy Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Popup ────────────────────────────────────────────────────────────────
function PopupApp() {
  const [tab, setTab] = useState<'prompts' | 'ai'>('prompts');
  const [portals, setPortals] = useState<AiPortal[]>(DEFAULT_AI_PORTALS);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [apps, setApps] = useState<AppShortcut[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [shortcutSource, setShortcutSource] = useState<string>('ai');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    chrome.storage.local.get(CONFIG_KEY, (result) => {
      const cfg = result[CONFIG_KEY] as Partial<AppConfig> | undefined;
      if (!cfg) return;
      if (cfg.aiPortals?.length) setPortals(cfg.aiPortals);
      if (cfg.prompts?.length) setPrompts(cfg.prompts);
      if (cfg.apps) setApps(cfg.apps);
      if (cfg.pinnedIds) setPinnedIds(cfg.pinnedIds);
      if (cfg.spaces) setSpaces(cfg.spaces);
      if (cfg.popupShortcutSource) setShortcutSource(cfg.popupShortcutSource);
    });
  }, []);

  const allTags: PromptTag[] = [];
  const tagSeen = new Set<string>();
  prompts.forEach((p) => p.tags.forEach((tag) => {
    if (!tagSeen.has(tag.label)) { tagSeen.add(tag.label); allTags.push(tag); }
  }));

  const filteredPrompts = prompts.filter((p) => {
    if (activeTag && !p.tags.some((t) => t.label === activeTag)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  const shortcutItems: { id: string; name: string; url: string }[] = (() => {
    if (shortcutSource === 'dock') {
      return pinnedIds
        .map((id) => apps.find((a) => a.id === id))
        .filter((a): a is AppShortcut => !!a && !!a.url);
    }
    if (shortcutSource.startsWith('space:')) {
      const spaceId = shortcutSource.slice(6);
      return apps.filter((a) => a.spaceId === spaceId && !a.folderId);
    }
    return [];
  })();

  const enabledPortals = portals.filter((p) => p.enabled);

  return (
    <>
      <div style={{
        width: 360, minHeight: 500, maxHeight: 620,
        display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
        color: '#f1f5f9', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>iTab</span>
          <div style={{ marginLeft: 'auto', display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 2, gap: 2 }}>
            {(['prompts', 'ai'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '3px 11px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                background: tab === t ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
              }}>
                {t === 'prompts' ? '📚 Prompts' : '🤖 AI'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Prompts Tab ── */}
        {tab === 'prompts' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px 0' }}>
              <input
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 12px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)', color: '#f1f5f9',
                  fontSize: 12, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {allTags.length > 0 && (
              <div style={{ padding: '6px 14px', display: 'flex', gap: 5, overflowX: 'auto', flexShrink: 0 }}>
                <button
                  onClick={() => setActiveTag(null)}
                  style={{
                    padding: '2px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                    background: activeTag === null ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: activeTag === null ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >All</button>
                {allTags.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => setActiveTag(activeTag === tag.label ? null : tag.label)}
                    style={{
                      padding: '2px 9px', borderRadius: 8, border: `1px solid ${tag.color}`,
                      background: activeTag === tag.label ? tag.color + '44' : 'transparent',
                      color: tag.color, fontSize: 10, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >{tag.label}</button>
                ))}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 12px' }}>
              {filteredPrompts.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 40 }}>
                  {prompts.length === 0 ? 'No prompts saved. Add them in iTab.' : 'No results.'}
                </div>
              )}
              {filteredPrompts.map((p) => (
                <PromptItem key={p.id} prompt={p} onPreview={() => setPreviewPrompt(p)} />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Tab ── */}
        {tab === 'ai' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>AI Portals</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginBottom: 16 }}>
              {enabledPortals.map((portal) => (
                <ShortcutItem key={portal.id} name={portal.name} url={portal.url} />
              ))}
            </div>

            {shortcutItems.length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  {shortcutSource === 'dock' ? 'Dock' :
                    spaces.find((s) => `space:${s.id}` === shortcutSource)?.name ?? 'Shortcuts'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                  {shortcutItems.map((item) => (
                    <ShortcutItem key={item.id} name={item.name} url={item.url} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>iTab v1.1.0</span>
          <button onClick={() => chrome.tabs.create({ url: 'chrome://newtab' })} style={{
            padding: '3px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)',
          }}>Open iTab →</button>
        </div>
      </div>

      {/* Preview modal — rendered outside main div to avoid overflow:hidden clipping */}
      {previewPrompt && <PreviewModal prompt={previewPrompt} onClose={() => setPreviewPrompt(null)} />}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
