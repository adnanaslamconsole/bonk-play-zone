// Web Audio API sound effects & background music (no external files needed)

let audioCtx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicPlaying = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBonkSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);

  // Add a "thwack" noise burst
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.4, ctx.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  noise.connect(nGain);
  nGain.connect(ctx.destination);
  noise.start(ctx.currentTime);
}

export function playEliminationSound() {
  const ctx = getCtx();
  // Descending tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);

  // Pop
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(800, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  g2.gain.setValueAtTime(0.25, ctx.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc2.start(ctx.currentTime);
  osc2.stop(ctx.currentTime + 0.15);
}

export function playPowerUpSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);

  // Shimmer
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.25);
  g2.gain.setValueAtTime(0.15, ctx.currentTime + 0.05);
  g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc2.start(ctx.currentTime + 0.05);
  osc2.stop(ctx.currentTime + 0.3);
}

export function playVictorySound() {
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playAchievementSound() {
  const ctx = getCtx();
  // Triumphant fanfare notes
  const notes = [523, 659, 784, 1047, 784, 1047, 1319]; // C5, E5, G5, C6, G5, C6, E6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

export function playDefeatSound() {
  const ctx = getCtx();
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

let musicTimerId: any = null;

export function startBackgroundMusic() {
  if (musicPlaying) return;
  const ctx = getCtx();
  musicPlaying = true;

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.35; // LOUD and energetic volume!
  musicGain.connect(ctx.destination);

  // Fast chaotic tempo
  const bpm = 160; 
  const eighthNote = (60 / bpm) / 2;

  // Groovy driving bassline
  const bassNotes = [
    98, 98, 116.54, 130.81,  98, 98, 146.83, 130.81,
    98, 98, 116.54, 130.81,  155.56, 146.83, 130.81, 116.54
  ];

  // Upbeat, frantic melody
  const melodyNotes = [
    392, 0, 466.16, 523.25, 0, 587.33, 523.25, 466.16,
    392, 0, 466.16, 523.25, 0, 698.46, 659.25, 587.33,
    392, 0, 466.16, 523.25, 0, 587.33, 523.25, 466.16,
    783.99, 698.46, 587.33, 523.25, 466.16, 523.25, 587.33, 466.16
  ];

  let step = 0;
  let nextNoteTime = ctx.currentTime + 0.1;

  function schedule() {
    if (!musicPlaying || !musicGain) return;
    
    // Look-ahead schedule loop
    while (nextNoteTime < ctx.currentTime + 0.1) {
      const t = nextNoteTime;
      const bIdx = step % 16;
      const mIdx = step % 32;

      // Kick & Hi-hat (four-on-the-floor beat)
      if (bIdx % 2 === 0) {
        const kOsc = ctx.createOscillator();
        const kGain = ctx.createGain();
        kOsc.connect(kGain);
        kGain.connect(musicGain!);
        kOsc.type = 'sine';
        kOsc.frequency.setValueAtTime(150, t);
        kOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        kGain.gain.setValueAtTime(0.8, t);
        kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        kOsc.start(t);
        kOsc.stop(t + 0.2);
      } else {
        const hBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const hData = hBuf.getChannelData(0);
        for(let j=0; j<hData.length; j++) hData[j] = Math.random() * 2 - 1;
        const hSrc = ctx.createBufferSource();
        hSrc.buffer = hBuf;
        const hFilter = ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.value = 6000;
        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(0.2, t);
        hGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        hSrc.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(musicGain!);
        hSrc.start(t);
      }

      // Bass synth
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.connect(bGain);
      bGain.connect(musicGain!);
      bOsc.type = 'sawtooth';
      bOsc.frequency.value = bassNotes[bIdx];
      bGain.gain.setValueAtTime(0.4, t);
      bGain.gain.exponentialRampToValueAtTime(0.01, t + eighthNote * 0.9);
      bOsc.start(t);
      bOsc.stop(t + eighthNote * 0.9);

      // Chiptune Melody
      const mFreq = melodyNotes[mIdx];
      if (mFreq > 0) {
        const mOsc = ctx.createOscillator();
        const mGain = ctx.createGain();
        mOsc.connect(mGain);
        mGain.connect(musicGain!);
        mOsc.type = 'square';
        mOsc.frequency.setValueAtTime(mFreq, t);
        mGain.gain.setValueAtTime(0.25, t);
        mGain.gain.exponentialRampToValueAtTime(0.01, t + eighthNote * 0.8);
        mOsc.start(t);
        mOsc.stop(t + eighthNote * 0.8);
      }

      nextNoteTime += eighthNote;
      step++;
    }
    musicTimerId = setTimeout(schedule, 25);
  }

  schedule();
}

export function stopBackgroundMusic() {
  musicPlaying = false;
  clearTimeout(musicTimerId);
  if (musicGain) {
    musicGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
    setTimeout(() => { musicGain = null; }, 600);
  }
}
