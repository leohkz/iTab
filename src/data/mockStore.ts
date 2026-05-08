import type { AppConfig } from '../types';
import { DEFAULT_NOTE_TABS, DEFAULT_SPACES, DEFAULT_TODO_LISTS } from '../types';

export const spaces = DEFAULT_SPACES;

export const recentTabs: AppConfig['apps'] = [];

const DEFAULT_META = { enabled: true, minimised: false, pinned: false, expanded: false };

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
  prompts: [
    {
      id: 'prompt-image-gen',
      title: '\uD83C\uDFA8 Cinematic Image Prompt',
      content: `Create a photorealistic image of [SUBJECT].

Style: Cinematic, shot on Sony A7R IV, 85mm f/1.4 lens
Lighting: Golden hour, soft side lighting, subtle lens flare
Mood: [MOOD — e.g. serene / dramatic / mysterious]
Color palette: Warm tones, slight film grain, muted shadows
Composition: Rule of thirds, shallow depth of field, bokeh background
Aspect ratio: 16:9
Negative prompt: cartoon, illustration, blurry, watermark, text`,
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
      content: `You are an expert research analyst. Your task is to conduct deep research on the following topic:

Topic: [INSERT TOPIC]

Instructions:
1. Search for the latest information (prioritise sources from the last 12 months)
2. Identify the top 5 key insights
3. Find contrarian viewpoints and challenges
4. Summarise in a structured report with:
   - Executive Summary (3 sentences)
   - Key Findings (bullet points)
   - Data & Statistics
   - Opposing Views
   - Actionable Recommendations
5. Cite sources with URLs where possible

Output format: Markdown`,
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
      content: `You are a world-class copywriter who specialises in viral social media content.

Product / Topic: [DESCRIBE YOUR PRODUCT OR TOPIC]
Target audience: [WHO ARE THEY — age, interests, pain points]
Platform: [Instagram / LinkedIn / Twitter / Facebook]
Goal: [Awareness / Engagement / Sales / Sign-ups]

Write 3 variations of a post using these frameworks:
1. AIDA (Attention → Interest → Desire → Action)
2. PAS (Problem → Agitate → Solution)
3. Hook + Story + CTA

Requirements:
- Each post under 280 characters for Twitter, or up to 2,200 for Instagram
- Include 5 relevant hashtags
- Add an emoji strategy (no more than 4 emojis per post)
- End with a clear, compelling CTA`,
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
      iconType: 'url',
      iconValue: 'https://cdn.oaistatic.com/assets/favicon-o20kmmos.svg',
      iconColor: '',
    },
    {
      id: 'notion',
      name: 'Notion',
      url: 'https://notion.so',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://www.notion.so/images/favicon.ico',
      iconColor: '',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://www.youtube.com/s/desktop/3f6a3383/img/favicon_144x144.png',
      iconColor: '',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      url: 'https://mail.google.com',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
      iconColor: '',
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://perplexity.ai',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://www.perplexity.ai/favicon.ico',
      iconColor: '',
    },
    {
      id: 'figma',
      name: 'Figma',
      url: 'https://figma.com',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://static.figma.com/app/icon/1/favicon.svg',
      iconColor: '',
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://github.githubassets.com/favicons/favicon.svg',
      iconColor: '',
    },
    {
      id: 'linear',
      name: 'Linear',
      url: 'https://linear.app',
      folderId: null,
      iconType: 'url',
      iconValue: 'https://linear.app/favicon.ico',
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
