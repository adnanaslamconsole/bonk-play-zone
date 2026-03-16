// Arena themes that rotate each round

export interface ArenaTheme {
  name: string;
  bgInner: string;
  bgOuter: string;
  platformInner: string;
  platformMid: string;
  platformOuter: string;
  edgeHue: number;
  edgeGlow: string;
  gridColor: string;
  dangerColor: string;
  particleAccent: string;
}

export const ARENA_THEMES: ArenaTheme[] = [
  {
    name: 'Neon Void',
    bgInner: '#2d1b4e', bgOuter: '#0f0a1a',
    platformInner: '#3d2266', platformMid: '#2a1650', platformOuter: '#1a0e33',
    edgeHue: 320, edgeGlow: '#ff6b9d',
    gridColor: 'rgba(255,255,255,0.05)', dangerColor: 'rgba(255,0,50,0.05)',
    particleAccent: '#ff6b9d',
  },
  {
    name: 'Lava Pit',
    bgInner: '#3d1500', bgOuter: '#1a0800',
    platformInner: '#4a2000', platformMid: '#3a1800', platformOuter: '#2a1000',
    edgeHue: 20, edgeGlow: '#ff6600',
    gridColor: 'rgba(255,100,0,0.08)', dangerColor: 'rgba(255,80,0,0.08)',
    particleAccent: '#ff9100',
  },
  {
    name: 'Ice Kingdom',
    bgInner: '#0a2a4a', bgOuter: '#040e1a',
    platformInner: '#1a4a6a', platformMid: '#103a5a', platformOuter: '#082a44',
    edgeHue: 195, edgeGlow: '#00e5ff',
    gridColor: 'rgba(100,200,255,0.06)', dangerColor: 'rgba(0,150,255,0.05)',
    particleAccent: '#00e5ff',
  },
  {
    name: 'Toxic Swamp',
    bgInner: '#1a2e0a', bgOuter: '#0a1400',
    platformInner: '#2a4a10', platformMid: '#1e3a0a', platformOuter: '#142a04',
    edgeHue: 100, edgeGlow: '#76ff03',
    gridColor: 'rgba(100,255,0,0.06)', dangerColor: 'rgba(0,255,50,0.05)',
    particleAccent: '#76ff03',
  },
  {
    name: 'Candy Land',
    bgInner: '#4a1a4a', bgOuter: '#1a0a1a',
    platformInner: '#6a2a5a', platformMid: '#5a1a4a', platformOuter: '#3a0a30',
    edgeHue: 300, edgeGlow: '#e040fb',
    gridColor: 'rgba(255,100,255,0.06)', dangerColor: 'rgba(255,0,200,0.05)',
    particleAccent: '#e040fb',
  },
  {
    name: 'Golden Temple',
    bgInner: '#3a2a00', bgOuter: '#1a1200',
    platformInner: '#5a4010', platformMid: '#4a3008', platformOuter: '#3a2200',
    edgeHue: 45, edgeGlow: '#FFD700',
    gridColor: 'rgba(255,215,0,0.08)', dangerColor: 'rgba(255,200,0,0.05)',
    particleAccent: '#FFD700',
  },
];

export function getThemeForRound(round: number): ArenaTheme {
  return ARENA_THEMES[(round - 1) % ARENA_THEMES.length];
}
