import { Music, Plus, Trash2, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────
export type SoundTab = 'soundscapes' | 'spotify' | 'youtube';

export interface MediaLink {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  type: 'spotify' | 'youtube';
  deleted?: boolean; // user can delete presets too
}

export interface FocusSoundState {
  open: boolean;
  tab: SoundTab;
  soundscapeVolumes: Record<string, number>;
  activeMediaId: string | null;
  customLinks: MediaLink[];
  deletedPresetIds: string[]; // track deleted presets
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

// ── Soundscapes ──────────────────────────────────────────────────────────
const SOUNDSCAPES = [
  { id: 'rain',       label: '下雨',     emoji: '🌧️', color: '#3b82f6', url: 'https://cdn.pixabay.com/audio/2022/05/13/audio_1b2571cd4c.mp3' },
  { id: 'cafe',       label: '咖啡廳',   emoji: '☕',  color: '#92400e', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_fef4d6ca8d.mp3' },
  { id: 'forest',     label: '森林',     emoji: '🌲',  color: '#16a34a', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_8b56e0f8f7.mp3' },
  { id: 'ocean',      label: '海浪',     emoji: '🌊',  color: '#0284c7', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bfba8a.mp3' },
  { id: 'fire',       label: '篝火',     emoji: '🔥',  color: '#ea580c', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1fba.mp3' },
  { id: 'wind',       label: '風聲',     emoji: '💨',  color: '#94a3b8', url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668d05.mp3' },
  { id: 'birds',      label: '鳥鳴',     emoji: '🐦',  color: '#84cc16', url: 'https://cdn.pixabay.com/audio/2022/03/09/audio_eff0025141.mp3' },
  { id: 'thunder',    label: '雷雨',     emoji: '⛈️',  color: '#6366f1', url: 'https://cdn.pixabay.com/audio/2022/10/19/audio_19cc07e0e3.mp3' },
  { id: 'whitenoise', label: '白噪音',   emoji: '📺',  color: '#64748b', url: 'https://cdn.pixabay.com/audio/2022/03/22/audio_9699d5b3e9.mp3' },
  { id: 'creek',      label: '溪流',     emoji: '🏞️',  color: '#06b6d4', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_c8f8ed7d55.mp3' },
  { id: 'keyboard',   label: '鍵盤聲',   emoji: '⌨️',  color: '#a855f7', url: 'https://cdn.pixabay.com/audio/2022/03/22/audio_d1718ab41b.mp3' },
  { id: 'binaural',   label: '雙耳節拍', emoji: '🎵',  color: '#ec4899', url: 'https://cdn.pixabay.com/audio/2022/01/27/audio_d0ef461f4e.mp3' },
];

// ── Spotify presets ─────────────────────────────────────────────────────────
export const SPOTIFY_PLAYLISTS: MediaLink[] = [
  { id: 'sp1', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', title: 'Brain Food',         thumbnail: 'https://i.scdn.co/image/ab67706f00000002b40b4fc67b1ec5b4a6bb3024' },
  { id: 'sp2', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6', title: 'Deep Focus',         thumbnail: 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6' },
  { id: 'sp3', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', title: 'Peaceful Piano',     thumbnail: 'https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6' },
  { id: 'sp4', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn', title: 'lofi beats',         thumbnail: 'https://i.scdn.co/image/ab67706f00000002108cb0c3cb9f6d9e3c4c0b3c' },
  { id: 'sp5', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT', title: 'Focus Flow',         thumbnail: 'https://i.scdn.co/image/ab67706f000000025551996f500ba876bda73fa5' },
  { id: 'sp6', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', title: "Today's Top Hits",   thumbnail: 'https://i.scdn.co/image/ab67706f000000025551996f500ba876bda73fa5' },
  { id: 'sp7', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8', title: 'Atmospheric Focus',  thumbnail: 'https://i.scdn.co/image/ab67706f00000002e435a4c0c6a9079e2ae7bc43' },
  { id: 'sp8', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcF6B6QPhFDv', title: 'Jazz Vibes',         thumbnail: 'https://i.scdn.co/image/ab67706f00000002e435a4c0c6a9079e2ae7bc43' },
  { id: 'sp9', type: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjEK', title: 'Ambient Relaxation', thumbnail: 'https://i.scdn.co/image/ab67706f00000002b40b4fc67b1ec5b4a6bb3024' },
];

// ── YouTube presets ───────────────────────────────────────────────────────────
export const YOUTUBE_VIDEOS: MediaLink[] = [
  { id: 'yt1',  type: 'youtube', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'lofi hip hop radio 📚',       thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg' },
  { id: 'yt2',  type: 'youtube', url: 'https://www.youtube.com/watch?v=lTRiuFIWV54', title: 'synthwave radio 🌌',           thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/mqdefault.jpg' },
  { id: 'yt3',  type: 'youtube', url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY', title: 'Brown Noise | Deep Focus',     thumbnail: 'https://i.ytimg.com/vi/5yx6BWlEVcY/mqdefault.jpg' },
  { id: 'yt4',  type: 'youtube', url: 'https://www.youtube.com/watch?v=DWcJFNfaw9c', title: 'Classical Music for Study',    thumbnail: 'https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg' },
  { id: 'yt5',  type: 'youtube', url: 'https://www.youtube.com/watch?v=7NOSDKb0HlU', title: 'Deep Focus Music',            thumbnail: 'https://i.ytimg.com/vi/7NOSDKb0HlU/mqdefault.jpg' },
  { id: 'yt6',  type: 'youtube', url: 'https://www.youtube.com/watch?v=n61ULEU7CO0', title: 'Relaxing Work Music',         thumbnail: 'https://i.ytimg.com/vi/n61ULEU7CO0/mqdefault.jpg' },
  { id: 'yt7',  type: 'youtube', url: 'https://www.youtube.com/watch?v=oR1EfRkFq-Q', title: 'Smooth Neo Soul Jazz',        thumbnail: 'https://i.ytimg.com/vi/oR1EfRkFq-Q/mqdefault.jpg' },
  { id: 'yt8',  type: 'youtube', url: 'https://www.youtube.com/watch?v=hHW1oY26kxQ', title: 'ADHD Relief Music',           thumbnail: 'https://i.ytimg.com/vi/hHW1oY26kxQ/mqdefault.jpg' },
  { id: 'yt9',  type: 'youtube', url: 'https://www.youtube.com/watch?v=NA2Oj9xqaZQ', title: 'Loft Work Office Ambience',   thumbnail: 'https://i.ytimg.com/vi/NA2Oj9xqaZQ/mqdefault.jpg' },
  { id: 'yt10', type: 'youtube', url: 'https://www.youtube.com/watch?v=q76bMs-NwRk', title: 'Coffee Shop Ambience ☕',     thumbnail: 'https://i.ytimg.com/vi/q76bMs-NwRk/mqdefault.jpg' },
];

// ── Helpers ───────────────────────────────────────────────────────────
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
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}
function getThumbnail(link: MediaLink) {
  if (link.thumbnail) return link.thumbnail;
  if (link.type === 'youtube') {
    const id = getYoutubeId(link.url);
    return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
  }
  return null;
}

// ── Audio engine ─────────────────────────────────────────────────────────
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

// ── SoundscapeGrid: square cards, click = play, slider below icon ───
function SoundscapeGrid({
  volumes, onChange,
}: {
  volumes: Record<string, number>;
  onChange: (id: string, vol: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      {SOUNDSCAPES.map(s => {
        const vol = volumes[s.id] ?? 0;
        const active = vol > 0;
        return (
          <div
            key={s.id}
            className="flex flex-col rounded-2xl overflow-hidden transition"
            style={{
              background: active ? `${s.color}22` : 'rgba(255,255,255,0.05)',
              outline: active ? `2px solid ${s.color}88` : '2px solid transparent',
            }}
          >
            {/* Accent bar */}
            <div
              className="h-1.5 w-full rounded-t-full transition-all"
              style={{ background: active ? s.color : 'rgba(255,255,255,0.10)' }}
            />
            {/* Icon + label */}
            <button
              onClick={() => onChange(s.id, active ? 0 : 0.6)}
              className="flex flex-col items-center justify-center gap-1 pt-3 pb-2 px-1 w-full"
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <span className={[
                'text-[10px] font-semibold leading-tight text-center',
                active ? 'text-white' : 'text-white/50',
              ].join(' ')}>{s.label}</span>
            </button>
            {/* Volume slider — shown when active */}
            <div
              className="overflow-hidden transition-all duration-200 px-2 pb-2"
              style={{ maxHeight: active ? 28 : 0, opacity: active ? 1 : 0 }}
            >
              <div className="flex items-center gap-1">
                <Volume2 className="h-2.5 w-2.5 shrink-0" style={{ color: s.color }} />
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={vol}
                  onChange={e => onChange(s.id, Number(e.target.value))}
                  className="flex-1 h-1"
                  style={{ accentColor: s.color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MediaGrid: square cards, all items deletable ────────────────────
function MediaGrid({
  items, activeId, onSelect, onDelete,
}: {
  items: MediaLink[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {items.map(item => {
        const thumb = getThumbnail(item);
        const active = activeId === item.id;
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => onSelect(item.id)}
              className={[
                'relative overflow-hidden rounded-2xl text-left w-full transition',
                active ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/40',
              ].join(' ')}
            >
              <div className="aspect-video bg-white/10 flex items-center justify-center overflow-hidden">
                {thumb
                  ? <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                  : <Music className="h-6 w-6 text-white/30" />
                }
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2">
                <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">{item.title}</p>
              </div>
              {active && <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-white animate-pulse" />}
            </button>
            {/* Delete — all items */}
            <button
              onClick={() => onDelete(item.id)}
              className="absolute top-1 left-1 h-5 w-5 rounded-lg bg-black/60 text-white/60 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              title="刪除"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── EmbedPlayer ─────────────────────────────────────────────────────────────
function EmbedPlayer({ link }: { link: MediaLink | null }) {
  if (!link) return null;
  if (link.type === 'spotify') {
    return (
      <div className="mx-4 mb-1 mt-3 rounded-2xl overflow-hidden">
        <iframe key={link.id} src={getSpotifyEmbed(link.url)} width="100%" height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="rounded-2xl" title={link.title} />
      </div>
    );
  }
  const embedUrl = getYoutubeEmbed(link.url);
  if (!embedUrl) return null;
  return (
    <div className="mx-4 mb-1 mt-3 rounded-2xl overflow-hidden aspect-video">
      <iframe key={link.id} src={embedUrl} width="100%" height="100%"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen className="rounded-2xl w-full h-full" title={link.title} />
    </div>
  );
}

// ── AddLinkForm ────────────────────────────────────────────────────────────
function AddLinkForm({
  tab, onAdd, onCancel,
}: {
  tab: SoundTab;
  onAdd: (link: MediaLink) => void;
  onCancel: () => void;
}) {
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
    onAdd({
      id, url: trimmed, type,
      title: title.trim() || (type === 'spotify' ? 'Spotify 播放清單' : 'YouTube 影片'),
      thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3 p-6">
      <p className="text-sm font-bold text-white">新增{tab === 'spotify' ? ' Spotify' : ' YouTube'}</p>
      <input ref={inputRef} value={url} onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        placeholder={tab === 'spotify' ? 'Spotify 連結' : 'YouTube 連結'}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/50" />
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="標題（可選）"
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/50" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl bg-white/8 hover:bg-white/15 text-white/60 text-sm font-semibold px-4 py-2 transition">取消</button>
        <button onClick={handleAdd} disabled={!url.trim()} className="rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-5 py-2 transition disabled:opacity-40">新增</button>
      </div>
    </div>
  );
}

// ── Main FocusSoundPanel ─────────────────────────────────────────────────────
export function FocusSoundPanel({
  state, onChange, onClose,
}: {
  state: FocusSoundState;
  onChange: (s: FocusSoundState) => void;
  onClose: () => void;
}) {
  const [addingLink, setAddingLink] = useState(false);
  const deleted = state.deletedPresetIds ?? [];

  useEffect(() => {
    SOUNDSCAPES.forEach(s => {
      engine.setVolume(s.id, s.url, state.soundscapeVolumes[s.id] ?? 0);
    });
  }, [state.soundscapeVolumes]);

  const set = (patch: Partial<FocusSoundState>) => onChange({ ...state, ...patch });

  // Build visible lists (filter deleted presets)
  const visibleSpotify: MediaLink[] = [
    ...SPOTIFY_PLAYLISTS.filter(p => !deleted.includes(p.id)),
    ...state.customLinks.filter(l => l.type === 'spotify'),
  ];
  const visibleYoutube: MediaLink[] = [
    ...YOUTUBE_VIDEOS.filter(p => !deleted.includes(p.id)),
    ...state.customLinks.filter(l => l.type === 'youtube'),
  ];

  const allVisible = [...visibleSpotify, ...visibleYoutube];
  const activeLink = allVisible.find(i => i.id === state.activeMediaId) ?? null;

  const handleDelete = (id: string) => {
    // Is it a preset?
    const isPreset = [...SPOTIFY_PLAYLISTS, ...YOUTUBE_VIDEOS].some(p => p.id === id);
    if (isPreset) {
      set({
        deletedPresetIds: [...deleted, id],
        activeMediaId: state.activeMediaId === id ? null : state.activeMediaId,
      });
    } else {
      set({
        customLinks: state.customLinks.filter(l => l.id !== id),
        activeMediaId: state.activeMediaId === id ? null : state.activeMediaId,
      });
    }
  };

  const TABS: { id: SoundTab; label: string }[] = [
    { id: 'soundscapes', label: '環境音' },
    { id: 'spotify',     label: 'Spotify' },
    { id: 'youtube',     label: 'YouTube' },
  ];
  const canAdd = state.tab === 'spotify' || state.tab === 'youtube';
  const currentItems = state.tab === 'spotify' ? visibleSpotify : visibleYoutube;

  if (addingLink) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onMouseDown={e => { if (e.target === e.currentTarget) setAddingLink(false); }}>
        <div className="w-[min(440px,calc(100vw-2rem))] rounded-3xl shadow-2xl"
          style={{ background: 'rgba(12,12,22,0.98)', backdropFilter: 'blur(24px)' }}>
          <AddLinkForm tab={state.tab}
            onAdd={link => { set({ customLinks: [...state.customLinks, link] }); setAddingLink(false); }}
            onCancel={() => setAddingLink(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          width: 'min(680px,calc(100vw - 2rem))',
          maxHeight: 'min(82vh, 720px)',
          background: 'rgba(12,12,22,0.98)',
          backdropFilter: 'blur(24px)',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-white/60" />
            <span className="font-bold text-sm text-white">聲音 &amp; 音樂</span>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <button onClick={() => setAddingLink(true)}
                className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/18 text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 transition">
                <Plus className="h-3 w-3" /> 新增
              </button>
            )}
            <button onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2.5 border-b border-white/8 shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => set({ tab: tab.id })}
              className={[
                'rounded-xl px-4 py-1.5 text-sm font-semibold transition',
                state.tab === tab.id ? 'bg-white text-black' : 'text-white/55 hover:text-white hover:bg-white/10',
              ].join(' ')}>
              {tab.label}
            </button>
          ))}
          {state.activeMediaId && (
            <button onClick={() => set({ activeMediaId: null })}
              className="ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-white/8 transition">
              ▶ 播放中
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {state.tab === 'soundscapes' && (
            <SoundscapeGrid
              volumes={state.soundscapeVolumes}
              onChange={(id, vol) => set({ soundscapeVolumes: { ...state.soundscapeVolumes, [id]: vol } })}
            />
          )}
          {(state.tab === 'spotify' || state.tab === 'youtube') && (
            <>
              {activeLink && activeLink.type === state.tab && <EmbedPlayer link={activeLink} />}
              <MediaGrid
                items={currentItems}
                activeId={state.activeMediaId}
                onSelect={id => set({ activeMediaId: state.activeMediaId === id ? null : id })}
                onDelete={handleDelete}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
