export type SoundKey =
  | 'click'
  | 'character_select'
  | 'modal_open'
  | 'modal_close'
  | 'reward_claim'
  | 'lootbox_open'
  | 'coin_gain'
  | 'level_start'
  | 'level_win'
  | 'level_lose'
  | 'store_open'
  | 'purchase_success'
  | 'error';

type SoundMap = Record<SoundKey, string>;

type SoundCooldownMap = Record<SoundKey, number>;

interface PlaySoundOptions {
  volume?: number;
  ignoreCooldown?: boolean;
}

const SOUND_PATHS: SoundMap = {
  click: '/sounds/click.mp3',
  character_select: '/sounds/character-select.mp3',
  modal_open: '/sounds/modal-open.mp3',
  modal_close: '/sounds/modal-close.mp3',
  reward_claim: '/sounds/reward.mp3',
  lootbox_open: '/sounds/lootbox-open.mp3',
  coin_gain: '/sounds/coin-gain.mp3',
  level_start: '/sounds/level-start.mp3',
  level_win: '/sounds/win.mp3',
  level_lose: '/sounds/lose.mp3',
  store_open: '/sounds/store-open.mp3',
  purchase_success: '/sounds/purchase-success.mp3',
  error: '/sounds/error.mp3',
};

const SOUND_COOLDOWNS_MS: SoundCooldownMap = {
  click: 70,
  character_select: 120,
  modal_open: 120,
  modal_close: 120,
  reward_claim: 200,
  lootbox_open: 250,
  coin_gain: 120,
  level_start: 500,
  level_win: 500,
  level_lose: 500,
  store_open: 180,
  purchase_success: 180,
  error: 180,
};

const STORAGE_KEY = 'bonk-sound-muted';

class SoundManager {
  private muted = false;
  private baseAudio = new Map<SoundKey, HTMLAudioElement>();
  private lastPlayedAt = new Map<SoundKey, number>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = window.localStorage.getItem(STORAGE_KEY) === '1';
    }
  }

  preload(keys?: SoundKey[]) {
    const targets = keys ?? (Object.keys(SOUND_PATHS) as SoundKey[]);
    targets.forEach((key) => {
      const audio = this.getBaseAudio(key);
      audio.load();
    });
  }

  play(key: SoundKey, options: PlaySoundOptions = {}): boolean {
    if (this.muted) return false;
    if (typeof window === 'undefined') return false;

    const now = performance.now();
    const cooldown = SOUND_COOLDOWNS_MS[key];
    const last = this.lastPlayedAt.get(key) ?? 0;
    if (!options.ignoreCooldown && now - last < cooldown) {
      return false;
    }

    this.lastPlayedAt.set(key, now);
    const base = this.getBaseAudio(key);
    const audio = base.cloneNode(true) as HTMLAudioElement;
    audio.volume = Math.max(0, Math.min(1, options.volume ?? 1));
    audio.play().catch(() => {
      // Intentionally ignore autoplay/user-gesture failures.
    });
    return true;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(value: boolean) {
    this.muted = value;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    }
  }

  toggleMuted(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    return next;
  }

  private getBaseAudio(key: SoundKey): HTMLAudioElement {
    const cached = this.baseAudio.get(key);
    if (cached) return cached;

    const audio = new Audio(SOUND_PATHS[key]);
    audio.preload = 'auto';
    this.baseAudio.set(key, audio);
    return audio;
  }
}

export const soundManager = new SoundManager();

export const playSound = (key: SoundKey, options?: PlaySoundOptions) =>
  soundManager.play(key, options);

export const setSoundMuted = (muted: boolean) => soundManager.setMuted(muted);
export const toggleSoundMuted = () => soundManager.toggleMuted();
export const isSoundMuted = () => soundManager.isMuted();

