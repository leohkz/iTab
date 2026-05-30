import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import type { AiPortal, Prompt, AppConfig } from './types';
import { DEFAULT_AI_PORTALS } from './types';

const CONFIG_KEY = 'workspace-new-tab-config';

function getFaviconUrl(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch {
    return '';
  }
}

function PopupApp() {
  const [tab, setTab] = useState<'ai' | 'prompts'>('ai');
  const [portals, setPortals] = useState<AiPortal[]>(DEFAULT_AI_PORTALS);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.local.get(CONFIG_KEY, (result) => {
      const cfg = result[CONFIG_KEY] as Partial<AppConfig> | undefined;
      if (!cfg) return;
      if (cfg.aiPortals && cfg.aiPortals.length > 0) setPortals(cfg.aiPortals);
      if (cfg.prompts && cfg.prompts.length > 0) setPrompts(cfg.prompts);
    });
  }, []);

  const enabledPortals = portals.filter((p) => p.enabled);

  const filteredPrompts = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()),
  );

  const copyPrompt = (p: Prompt) => {
    navigator.clipboard.writeText(p.content).then(() => {
      setCopied(p.id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div
      style={{
        width: 360,
        minHeight: 480,
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#f1f5f9',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>iTab</span>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: 2,
            gap: 2,
          }}
        >
          {(['ai', 'prompts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                transition: 'all 0.15s',
                background: tab === t ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            >
              {t === 'ai' ? '🤖 AI' : '📚 Prompts'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: AI Portals */}
      {tab === 'ai' && (
        <div style={{ padding: '12px 16px 16px', overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {enabledPortals.map((portal) => (
              <button
                key={portal.id}
                onClick={() => chrome.tabs.create({ url: portal.url })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 8px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  color: '#f1f5f9',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              >
                <img
                  src={getFaviconUrl(portal.url)}
                  width={24}
                  height={24}
                  style={{ borderRadius: 6 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                  {portal.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Prompts */}
      {tab === 'prompts' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '10px 16px 0' }}>
          <input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.08)',
              color: '#f1f5f9',
              fontSize: 13,
              outline: 'none',
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 12 }}>
            {filteredPrompts.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 40 }}>
                {prompts.length === 0 ? 'No prompts saved yet.\nAdd prompts in iTab settings.' : 'No results.'}
              </div>
            )}
            {filteredPrompts.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, flex: 1, color: '#fff' }}>{p.title}</span>
                  <button
                    onClick={() => copyPrompt(p)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 7,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      background: copied === p.id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)',
                      color: copied === p.id ? '#86efac' : '#cbd5e1',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied === p.id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.content}
                </p>
                {p.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '1px 7px',
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 700,
                          background: tag.color + '33',
                          color: tag.color,
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>iTab v0.2.0</span>
        <button
          onClick={() => chrome.tabs.create({ url: 'chrome://newtab' })}
          style={{
            padding: '3px 10px',
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Open iTab →
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupApp />);
