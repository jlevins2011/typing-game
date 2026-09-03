let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = context();
  if (c?.state === "suspended") void c.resume();
}

function beep(freq: number, duration: number, type: OscillatorType, gain = 0.04): void {
  const c = context();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const sounds = {
  correct() {
    beep(660, 0.06, "sine", 0.03);
  },
  combo() {
    beep(880, 0.08, "triangle", 0.035);
  },
  miss() {
    beep(180, 0.12, "sine", 0.03);
  },
  star() {
    beep(523, 0.12, "triangle", 0.04);
    setTimeout(() => beep(659, 0.12, "triangle", 0.04), 90);
    setTimeout(() => beep(784, 0.18, "triangle", 0.04), 180);
  },
  start() {
    beep(392, 0.1, "sine", 0.04);
    setTimeout(() => beep(523, 0.14, "sine", 0.04), 100);
  },
};
