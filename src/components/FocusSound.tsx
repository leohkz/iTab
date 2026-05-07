import { Music, Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type SoundTab = 'soundscapes' | 'spotify' | 'youtube';

export interface MediaLink {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  type: 'spotify' | 'youtube';
  deleted?: boolean;
}

export interface FocusSoundState {
  open: boolean;
  tab: SoundTab;
  soundscapeVolumes: Record<string, number>;
  activeMediaId: string | null;
  customLinks: MediaLink[];
  deletedPresetIds: string[];
}

export function defaultFocusSoundState(): FocusSoundState {
  return {
    open: false,
    tab: 'soundscapes',
    soundscapeVolumes: {},
    activeMediaId: null,
    customLinks: [],
    deletedPresetIds: [],
  };
}

// ── SVG Icons ─────────────────────────────────────────────────────────
const SoundIcons: Record<string, React.ReactElement> = {
  rain: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2a7 7 0 0 0-7 7c0 .34.03.67.07 1H5a4 4 0 0 0 0 8h1.5l-1 3h2l1-3h5l-1 3h2l1-3H17a4 4 0 0 0 0-8h-.07A7 7 0 0 0 12 2z"/></svg>),
  cafe: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2 21h18v-2H2v2zM20 8h-2V5h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2zm-4-5H4v10a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V3z"/></svg>),
  forest: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L6 10h3v2H7l5 5 5-5h-2v-2h3L12 2zM9 20h6v2H9v-2z"/></svg>),
  ocean: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 18c1.5 0 3-1 4.5-1s3 1 4.5 1 3-1 4.5-1 3 1 4.5 1v-2c-1.5 0-3-1-4.5-1s-3 1-4.5 1-3-1-4.5-1-3 1-4.5 1v2zm0-4c1.5 0 3-1 4.5-1s3 1 4.5 1 3-1 4.5-1 3 1 4.5 1v-2c-1.5 0-3-1-4.5-1s-3 1-4.5 1-3-1-4.5-1-3 1-4.5 1v2zM12 6l-3 4h6l-3-4z"/></svg>),
  fire: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>),
  wind: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 8h10a2 2 0 1 0-2-2M3 12h14a2 2 0 1 0-2-2M3 16h8a2 2 0 1 0-2 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>),
  birds: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21 7c0 2.21-3.58 4-8 4S5 9.21 5 7s3.58-4 8-4 8 1.79 8 4zM5 7v10l8 3 8-3V7c-1.64 1.22-4.6 2-8 2S6.64 8.22 5 7z"/></svg>),
  thunder: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 2H9L7 12h4l-3 10 11-12h-5l3-8z"/></svg>),
  whitenoise: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zM3 7h2v2H3V7zm4 0h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM3 15h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM3 19h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>),
  creek: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 18c1.5-1 3-1.5 4.5-1S10.5 18 12 18s3-1 4.5-1.5S19 17 21 18v-3c-1.5-1-3-1.5-4.5-1S13.5 15 12 15s-3-1-4.5-1.5S4.5 14 3 15v3zm0-6c1.5-1 3-1.5 4.5-1S10.5 12 12 12s3-1 4.5-1.5S19 11 21 12V9c-1.5-1-3-1.5-4.5-1S13.5 9 12 9s-3-1-4.5-1.5S4.5 8 3 9v3z"/></svg>),
  keyboard: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 5H5v-2h2v2zm10 0H7v-2h10v2zm0-5h-2v-2h2v2zm0-3h-2V8h2v2zm2 8h-2v-2h2v2z"/></svg>),
  binaural: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2v-8H5v-1a7 7 0 0 1 14 0v1h-2v8h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/></svg>),
};

// ── Soundscapes ────────────────────────────────────────────────────────
const SOUNDSCAPES = [
  { id: 'rain',       label: '下雨',     url: 'https://cdn.pixabay.com/audio/2022/05/13/audio_1b2571cd4c.mp3' },
  { id: 'cafe',       label: '咖啡廳',   url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_fef4d6ca8d.mp3' },
  { id: 'forest',     label: '森林',     url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_8b56e0f8f7.mp3' },
  { id: 'ocean',      label: '海浪',     url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bfba8a.mp3' },
  { id: 'fire',       label: '篝火',     url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1fba.mp3' },
  { id: 'wind',       label: '風聲',     url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668d05.mp3' },
  { id: 'birds',      label: '鳥鳴',     url: 'https://cdn.pixabay.com/audio/2022/03/09/audio_eff0025141.mp3' },
  { id: 'thunder',    label: '雷雨',     url: 'https://cdn.pixabay.com/audio/2022/10/19/audio_19cc07e0e3.mp3' },
  { id: 'whitenoise', label: '白噪音',   url: 'https://cdn.pixabay.com/audio/2022/03/22/audio_9699d5b3e9.mp3' },
  { id: 'creek',      label: '溪流',     url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_c8f8ed7d55.mp3' },
  { id: 'keyboard',   label: '鍵盤聲',   url: 'https://cdn.pixabay.com/audio/2022/03/22/audio_d1718ab41b.mp3' },
  { id: 'binaural',   label: '雙耳節拍', url: 'https://cdn.pixabay.com/audio/2022/01/27/audio_d0ef461f4e.mp3' },
];

// ── Spotify presets ────────────────────────────────────────────────────
export const SPOTIFY_PLAYLISTS: MediaLink[] = [
  { id: 'sp1', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', title: 'Brain Food', thumbnail: 'https://i.scdn.co/image/ab67706f00000002b40b4fc67b1ec5b4a6bb3024' },
  { id: 'sp2', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6', title: 'Deep Focus', thumbnail: 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6' },
  { id: 'sp3', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', title: 'Peaceful Piano', thumbnail: 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6' },
  { id: 'sp4', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn', title: 'lofi beats', thumbnail: 'https://i.scdn.co/image/ab67706f00000002108cb0c3cb9f6d9e3c4c0b3c' },
  { id: 'sp5', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT', title: 'Focus Flow', thumbnail: 'https://i.scdn.co/image/ab67706f000000025551996f500ba876bda73fa5' },
  { id: 'sp6', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', title: "Today's Top Hits", thumbnail: 'https://i.scdn.co/image/ab67706f000000025551996f500ba876bda73fa5' },
  { id: 'sp7', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8', title: 'Atmospheric Focus', thumbnail: 'https://i.scdn.co/image/ab67706f00000002e435a4c0c6a9079e2ae7bc43' },
  { id: 'sp8', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcF6B6QPhFDv', title: 'Jazz Vibes', thumbnail: 'https://i.scdn.co/image/ab67706f00000002e435a4c0c6a9079e2ae7bc43' },
  { id: 'sp9', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjEK', title: 'Ambient Relaxation', thumbnail: 'https://i.scdn.co/image/ab67706f00000002b40b4fc67b1ec5b4a6bb3024' },
];

// ── YouTube presets ────────────────────────────────────────────────────
export const YOUTUBE_VIDEOS: MediaLink[] = [
  { id: 'yt1',  type: 'youtube', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'lofi hip hop radio', thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg' },
  { id: 'yt2',  type: 'youtube', url: 'https://www.youtube.com/watch?v=lTRiuFIWV54', title: 'synthwave radio', thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/mqdefault.jpg' },
  { id: 'yt3',  type: 'youtube', url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY', title: 'Brown Noise | Deep Focus', thumbnail: 'https://i.ytimg.com/vi/5yx6BWlEVcY/mqdefault.jpg' },
  { id: 'yt4',  type: 'youtube', url: 'https://www.youtube.com/watch?v=DWcJFNfaw9c', title: 'Classical Music for Study', thumbnail: 'https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg' },
  { id: 'yt5',  type: 'youtube', url: 'https://www.youtube.com/watch?v=7NOSDKb0HlU', title: 'Deep Focus Music', thumbnail: 'https://i.ytimg.com/vi/7NOSDKb0HlU/mqdefault.jpg' },
  { id: 'yt6',  type: 'youtube', url: 'https://www.youtube.com/watch?v=n61ULEU7CO0', title: 'Relaxing Work Music', thumbnail: 'https://i.ytimg.com/vi/n61ULEU7CO0/mqdefault.jpg' },
  { id: 'yt7',  type: 'youtube', url: 'https://www.youtube.com/watch?v=oR1EfRkFq-Q', title: 'Smooth Neo Soul Jazz', thumbnail: 'https://i.ytimg.com/vi/oR1EfRkFq-Q/mqdefault.jpg' },
  { id: 'yt8',  type: 'youtube', url: 'https://www.youtube.com/watch?v=hHW1oY26kxQ', title: 'ADHD Relief Music', thumbnail: 'https://i.ytimg.com/vi/hHW1oY26kxQ/mqdefault.jpg' },
  { id: 'yt9',  type: 'youtube', url: 'https://www.youtube.com/watch?v=NA2Oj9xqaZQ', title: 'Loft Work Office Ambience', thumbnail: 'https://i.ytimg.com/vi/NA2Oj9xqaZQ/mqdefault.jpg' },
  { id: 'yt10', type: 'youtube', url: 'https://www.youtube.com/watch?v=q76bMs-NwRk', title: 'Coffee Shop Ambience', thumbnail: 'https://i.ytimg.com/vi/q76bMs-NwRk/mqdefault.jpg' },
];

// ── Helpers ────────────────────────────────────────────────────────────
function getYoutubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?\s]+)/);
  return m ? m[1] : null;
}
function getSpotifyEmbed(url: string) {
  const base = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
  return base.includes('?') ? base + '&autoplay=1' : base + '?autoplay=1';
}
function getYoutubeEmbed(url: string) {
  const id = getYoutubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
}
function getThumbnail(link: MediaLink) {
  if (link.thumbnail) return link.thumbnail;
  if (link.type === 'youtube') {
    const id = getYoutubeId(link.url);
    return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
  }
  return null;
}

// ── Audio engine ────────────────────────────────────────────────────────
class SoundscapeEngine {
  private nodes = new Map<string, HTMLAudioElement>();
  setVolume(id: string, url: string, vol: number) {
    if (vol <= 0) {
      const a = this.nodes.get(id);
      if (a) { a.pause(); this.nodes.delete(id); }
      return;
    }
    let a = this.nodes.get(id);
    if (!a) {
      a = new Audio(url);
      a.loop = true;
      a.volume = vol;
      a.play().catch(() => {});
      this.nodes.set(id, a);
    } else {
      a.volume = vol;
    }
  }
  stopAll() { this.nodes.forEach(a => a.pause()); this.nodes.clear(); }
}
const engine = new SoundscapeEngine();

// ── PersistentEmbedPlayer (iframe only) ─────────────────────────────────
export function PersistentEmbedPlayer({ link, visible }: { link: MediaLink | null; visible: boolean }) {
  const prevLinkRef = useRef<MediaLink | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const displayLink = link ?? prevLinkRef.current;
  if (link) prevLinkRef.current = link;

  if (!portalRef.current) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(div);
    portalRef.current = div;
  }

  useEffect(() => {
    return () => {
      if (portalRef.current && document.body.contains(portalRef.current))
        document.body.removeChild(portalRef.current);
    };
  }, []);

  if (!displayLink) return null;
  const embedSrc = displayLink.type === 'spotify' ? getSpotifyEmbed(displayLink.url) : getYoutubeEmbed(displayLink.url);
  if (!embedSrc) return null;

  const iframeEl = (
    <iframe
      key={displayLink.id}
      src={embedSrc}
      width="100%"
      height="100%"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      style={{ border: 'none', borderRadius: visible ? '12px' : '0', display: 'block', backgroundColor: '#000' }}
      title={displayLink.title}
    />
  );

  if (visible) return <>{iframeEl}</>;
  return createPortal(iframeEl, portalRef.current!);
}

// ── SoundscapeGrid — minimal square buttons ─────────────────────────────
function SoundscapeGrid({ volumes, onChange }: { volumes: Record<string, number>; onChange: (id: string, vol: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      {SOUNDSCAPES.map(s => {
        const vol = volumes[s.id] ?? 0;
        const active = vol > 0;
        return (
          <div key={s.id} className="flex flex-col items-center gap-1.5">
            {/* Square button */}
            <button
              onClick={() => onChange(s.id, active ? 0 : 0.6)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '10px',
                background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                border: active ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {SoundIcons[s.id]}
              <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.02em', color: 'inherit', lineHeight: 1 }}>{s.label}</span>
            </button>
            {/* Volume bar — thick rounded line, only visible when active */}
            <div style={{ width: '100%', height: active ? 'auto' : 0, overflow: 'hidden', transition: 'all 0.2s' }}>
              {active && (
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={vol}
                  onChange={e => onChange(s.id, Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    cursor: 'pointer',
                    accentColor: '#fff',
                    borderRadius: '99px',
                    display: 'block',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MediaGrid ───────────────────────────────────────────────────────────
function MediaGrid({ items, activeId, onSelect, onDelete }: { items: MediaLink[]; activeId: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {items.map(item => {
        const thumb = getThumbnail(item);
        const active = activeId === item.id;
        return (
          <div key={item.id} className="relative group">
            <button onClick={() => onSelect(item.id)} className={['relative overflow-hidden rounded-2xl text-left w-full transition', active ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/40'].join(' ')}>
              <div className="aspect-square bg-white/10 flex items-center justify-center overflow-hidden">
                {thumb ? <img src={thumb} alt={item.title} className="w-full h-full object-cover" /> : <Music className="h-6 w-6 text-white/30" />}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2">
                <p className="text-[10px] font-semibold text-white leading-tight line-clamp-2">{item.title}</p>
              </div>
              {active && <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-white animate-pulse" />}
            </button>
            <button onClick={() => onDelete(item.id)} className="absolute top-1 left-1 h-5 w-5 rounded-lg bg-black/60 text-white/60 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition" title="刪除">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── AddLinkForm ─────────────────────────────────────────────────────────
function AddLinkForm({ tab, onAdd, onCancel }: { tab: SoundTab; onAdd: (link: MediaLink) => void; onCancel: () => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const type: 'spotify' | 'youtube' = trimmed.includes('spotify') ? 'spotify' : 'youtube';
    const id = 'custom_' + Date.now();
    const ytId = type === 'youtube' ? getYoutubeId(trimmed) : null;
    onAdd({ id, url: trimmed, type, title: title.trim() || (type === 'spotify' ? 'Spotify 播放清單' : 'YouTube 影片'), thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : undefined });
  };

  return (
    <div className="flex flex-col gap-3 p-6">
      <p className="text-sm font-bold text-white">新增{tab === 'spotify' ? ' Spotify' : ' YouTube'}</p>
      <input ref={inputRef} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} placeholder={tab === 'spotify' ? 'Spotify 連結' : 'YouTube 連結'} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/50" />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="標題（可選）" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/50" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl bg-white/8 hover:bg-white/15 text-white/60 text-sm font-semibold px-4 py-2 transition">取消</button>
        <button onClick={handleAdd} disabled={!url.trim()} className="rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2 transition disabled:opacity-40">新增</button>
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────
export function FocusSoundPanel({ state, onChange, onClose }: { state: FocusSoundState; onChange: (s: FocusSoundState) => void; onClose: () => void }) {
  const [addingLink, setAddingLink] = useState(false);
  const deleted = state.deletedPresetIds ?? [];

  useEffect(() => {
    SOUNDSCAPES.forEach(s => engine.setVolume(s.id, s.url, state.soundscapeVolumes[s.id] ?? 0));
  }, [state.soundscapeVolumes]);

  const set = (patch: Partial<FocusSoundState>) => onChange({ ...state, ...patch });

  const visibleSpotify: MediaLink[] = [...SPOTIFY_PLAYLISTS.filter(p => !deleted.includes(p.id)), ...state.customLinks.filter(l => l.type === 'spotify')];
  const visibleYoutube: MediaLink[] = [...YOUTUBE_VIDEOS.filter(p => !deleted.includes(p.id)), ...state.customLinks.filter(l => l.type === 'youtube')];
  const allVisible = [...visibleSpotify, ...visibleYoutube];
  const activeLink = allVisible.find(i => i.id === state.activeMediaId) ?? null;

  const handleDelete = (id: string) => {
    const isPreset = [...SPOTIFY_PLAYLISTS, ...YOUTUBE_VIDEOS].some(p => p.id === id);
    if (isPreset) set({ deletedPresetIds: [...deleted, id], activeMediaId: state.activeMediaId === id ? null : state.activeMediaId });
    else set({ customLinks: state.customLinks.filter(l => l.id !== id), activeMediaId: state.activeMediaId === id ? null : state.activeMediaId });
  };

  const TABS: { id: SoundTab; label: string }[] = [
    { id: 'soundscapes', label: '環境音' },
    { id: 'spotify', label: 'Spotify' },
    { id: 'youtube', label: 'YouTube' },
  ];
  const canAdd = state.tab === 'spotify' || state.tab === 'youtube';
  const currentItems = state.tab === 'spotify' ? visibleSpotify : visibleYoutube;
  const embedVisible = activeLink !== null && state.tab === activeLink.type;

  if (addingLink) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onMouseDown={e => { if (e.target === e.currentTarget) setAddingLink(false); }}>
        <div className="w-[min(440px,calc(100vw-2rem))] rounded-3xl shadow-2xl" style={{ background: 'rgba(12,12,22,0.98)', backdropFilter: 'blur(24px)' }}>
          <AddLinkForm tab={state.tab} onAdd={link => { set({ customLinks: [...state.customLinks, link] }); setAddingLink(false); }} onCancel={() => setAddingLink(false)} />
        </div>
      </div>
    );
  }

  return (
    <>
      {activeLink && <PersistentEmbedPlayer link={activeLink} visible={embedVisible} />}

      <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="flex flex-col rounded-3xl overflow-hidden shadow-2xl" style={{ width: 'min(680px,calc(100vw - 2rem))', maxHeight: 'min(82vh, 720px)', background: 'rgba(12,12,22,0.98)', backdropFilter: 'blur(24px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <span className="font-bold text-sm text-white">聲音 &amp; 音樂</span>
            <div className="flex items-center gap-2">
              {canAdd && (
                <button onClick={() => setAddingLink(true)} className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/18 text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 transition">
                  <Plus className="h-3 w-3" /> 新增
                </button>
              )}
              <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 py-2.5 border-b border-white/8 shrink-0">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => set({ tab: tab.id })} className={['rounded-xl px-4 py-1.5 text-sm font-semibold transition', state.tab === tab.id ? 'bg-white text-black' : 'text-white/55 hover:text-white hover:bg-white/10'].join(' ')}>
                {tab.label}
              </button>
            ))}
            {state.activeMediaId && (
              <button onClick={() => set({ activeMediaId: null })} className="ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-white/8 transition">
                ▶ 播放中
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {state.tab === 'soundscapes' && (
              <SoundscapeGrid volumes={state.soundscapeVolumes} onChange={(id, vol) => set({ soundscapeVolumes: { ...state.soundscapeVolumes, [id]: vol } })} />
            )}
            {(state.tab === 'spotify' || state.tab === 'youtube') && (
              <>
                {activeLink && activeLink.type === state.tab && (
                  <div className="mx-4 mt-3 mb-1 rounded-2xl overflow-hidden" style={{ height: activeLink.type === 'spotify' ? 152 : 'auto', aspectRatio: activeLink.type === 'youtube' ? '16/9' : undefined, background: '#000' }}>
                    <PersistentEmbedPlayer link={activeLink} visible={true} />
                  </div>
                )}
                <MediaGrid items={currentItems} activeId={state.activeMediaId} onSelect={id => set({ activeMediaId: state.activeMediaId === id ? null : id })} onDelete={handleDelete} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
