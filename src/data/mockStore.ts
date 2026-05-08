import type { AppConfig } from '../types';
import { DEFAULT_NOTE_TABS, DEFAULT_SPACES, DEFAULT_TODO_LISTS, DEFAULT_AI_PORTALS } from '../types';

export const spaces = DEFAULT_SPACES;

export const recentTabs: AppConfig['apps'] = [];

const DEFAULT_META = { enabled: true, minimised: false, pinned: false, expanded: false };

// Simple Icons CDN — open-source SVG brand icons, no CORS issues
// https://simpleicons.org  |  https://cdn.simpleicons.org/{slug}/{color}
const SI = (slug: string, color = '000000') =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

export const defaultConfig: AppConfig = {
  spaces: [...DEFAULT_SPACES],
  currentSpaceId: 'work',
  locale: 'en',
  theme: 'sonoma',
  glass: 72,
  gridColumns: 7,
  gridRows: 4,
  showDock: true,
  showWidgets: true,
  pinnedIds: ['chatgpt', 'notion', 'perplexity'],
  folders: [],
  // AI Portals — populated from DEFAULT_AI_PORTALS in types.ts
  aiPortals: [...DEFAULT_AI_PORTALS],
  aiPortalSize: 'lg',
  prompts: [
    {
      id: 'prompt-image-gen',
      title: '\uD83C\uDFA8 Cinematic Image Prompt',
      content: `Create a photorealistic image of [SUBJECT].\n\nStyle: Cinematic, shot on Sony A7R IV, 85mm f/1.4 lens\nLighting: Golden hour, soft side lighting, subtle lens flare\nMood: [MOOD — e.g. serene / dramatic / mysterious]\nColor palette: Warm tones, slight film grain, muted shadows\nComposition: Rule of thirds, shallow depth of field, bokeh background\nAspect ratio: 16:9\nNegative prompt: cartoon, illustration, blurry, watermark, text`,
      tags: [
        { label: 'Image Gen', color: '#8b5cf6' },
        { label: 'Midjourney', color: '#ec4899' },
      ],
      imageUrl: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&q=80',
      createdAt: 1715000000000,
    },
    {
      id: 'prompt-agent-research',
      title: '\uD83E\uDD16 Deep Research Agent',
      content: `You are an expert research analyst. Your task is to conduct deep research on the following topic:\n\nTopic: [INSERT TOPIC]\n\nInstructions:\n1. Search for the latest information (prioritise sources from the last 12 months)\n2. Identify the top 5 key insights\n3. Find contrarian viewpoints and challenges\n4. Summarise in a structured report with:\n   - Executive Summary (3 sentences)\n   - Key Findings (bullet points)\n   - Data & Statistics\n   - Opposing Views\n   - Actionable Recommendations\n5. Cite sources with URLs where possible\n\nOutput format: Markdown`,
      tags: [
        { label: 'Agent', color: '#0ea5e9' },
        { label: 'Research', color: '#10b981' },
      ],
      imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
      createdAt: 1715000001000,
    },
    {
      id: 'prompt-copywriting',
      title: '\u270D\uFE0F Viral Social Media Copy',
      content: `You are a world-class copywriter who specialises in viral social media content.\n\nProduct / Topic: [DESCRIBE YOUR PRODUCT OR TOPIC]\nTarget audience: [WHO ARE THEY — age, interests, pain points]\nPlatform: [Instagram / LinkedIn / Twitter / Facebook]\nGoal: [Awareness / Engagement / Sales / Sign-ups]\n\nWrite 3 variations of a post using these frameworks:\n1. AIDA (Attention → Interest → Desire → Action)\n2. PAS (Problem → Agitate → Solution)\n3. Hook + Story + CTA\n\nRequirements:\n- Each post under 280 characters for Twitter, or up to 2,200 for Instagram\n- Include 5 relevant hashtags\n- Add an emoji strategy (no more than 4 emojis per post)\n- End with a clear, compelling CTA`,
      tags: [
        { label: 'Copywriting', color: '#f59e0b' },
        { label: 'Marketing', color: '#ef4444' },
      ],
      imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
      createdAt: 1715000002000,
    },
  ],
  apps: [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      folderId: null,
      iconType: 'custom',
      iconValue: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/1280px-ChatGPT-Logo.svg.png',
      iconColor: '',
    },
    {
      id: 'notion',
      name: 'Notion',
      url: 'https://notion.so',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('notion', '000000'),
      iconColor: '',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('youtube', 'FF0000'),
      iconColor: '',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      url: 'https://mail.google.com',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('gmail', 'EA4335'),
      iconColor: '',
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://perplexity.ai',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('perplexity', '1FB8CD'),
      iconColor: '',
    },
    {
      id: 'figma',
      name: 'Figma',
      url: 'https://figma.com',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('figma', 'F24E1E'),
      iconColor: '',
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('github', '181717'),
      iconColor: '',
    },
    {
      id: 'linear',
      name: 'Linear',
      url: 'https://linear.app',
      folderId: null,
      iconType: 'custom',
      iconValue: SI('linear', '5E6AD2'),
      iconColor: '',
    },
  ],
  defaultEngine: 'google',
  searchEngines: [
    { id: 'google',      name: 'Google',      shortcut: 'g',  template: 'https://www.google.com/search?q={q}',             enabled: true, builtIn: true },
    { id: 'bing',        name: 'Bing',        shortcut: 'b',  template: 'https://www.bing.com/search?q={q}',                enabled: true, builtIn: true },
    { id: 'duckduckgo',  name: 'DuckDuckGo',  shortcut: 'd',  template: 'https://duckduckgo.com/?q={q}',                    enabled: true, builtIn: true },
    { id: 'perplexity',  name: 'Perplexity',  shortcut: 'p',  template: 'https://www.perplexity.ai/search?q={q}',           enabled: true, builtIn: true },
    { id: 'youtube',     name: 'YouTube',     shortcut: 'yt', template: 'https://www.youtube.com/results?search_query={q}', enabled: true, builtIn: true },
    { id: 'maps',        name: 'Google Maps', shortcut: 'm',  template: 'https://www.google.com/maps/search/{q}',           enabled: true, builtIn: true },
  ],
  widgets: {
    notes: '',
    noteTabs: [...DEFAULT_NOTE_TABS].map(t => ({ ...t, updatedAt: Date.now() })),
    activeNoteTabId: 'note-default',
    todos: [
      { id: 'todo-demo-1', text: 'Review pull request', done: false, listId: 'today' },
      { id: 'todo-demo-2', text: 'Team standup',        done: false, listId: 'today' },
      { id: 'todo-demo-3', text: 'Plan sprint goals',   done: false, listId: 'upcoming' },
    ],
    todoLists: [...DEFAULT_TODO_LISTS],
    activeTodoListId: 'today',
    pomodoroMinutes: 25,
    pomodoroBreakMinutes: 5,
    pomodoroRemainingSeconds: 1500,
    pomodoroRunning: false,
    pomodoroIsBreak: false,
    pomodoroTask: '',
    focusModeActive: false,
    todoMeta:     { ...DEFAULT_META },
    pomodoroMeta: { ...DEFAULT_META },
    notesMeta:    { ...DEFAULT_META },
  },
  experiments: {
    smartRecommendations: false,
    recentVisits: true,
    keyboardShortcuts: true,
    conflictWarning: true,
  },
};
