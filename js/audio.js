// Web Audio API 사운드 엔진 (별도 외부 파일 다운로드 없이 브라우저 내장 합성)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  initAudio() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // 찰진 뽁! 클릭음 (콤보에 따라 음계 상승)
  playClick(combo = 0) {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 440;
    const pitch = baseFreq * Math.pow(1.059463, Math.min(combo, 16));

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 청소 뽀드득 / 싹둑 사운드
  playClean() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 아이템(돋보기, 백신) 획득 챠라랑~
  playItem() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    });
  }

  // 백신 방어 발동음
  playShield() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 꽝! 비상 사이렌 & 폭발음
  playTrap() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 사이렌 소리 (Wobble)
    const siren = this.ctx.createOscillator();
    const sirenGain = this.ctx.createGain();
    siren.type = 'sawtooth';
    siren.frequency.setValueAtTime(700, now);
    siren.frequency.linearRampToValueAtTime(400, now + 0.15);
    siren.frequency.linearRampToValueAtTime(850, now + 0.3);
    siren.frequency.linearRampToValueAtTime(300, now + 0.55);

    sirenGain.gain.setValueAtTime(0.35, now);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    siren.connect(sirenGain);
    sirenGain.connect(this.ctx.destination);
    siren.start(now);
    siren.stop(now + 0.6);

    // 2. 쾅! 노이즈 폭발음
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch(e) {}
  }

  // 올클리어 승리 팡파레
  playVictory() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.12 },
      { f: 783.99, d: 0.12, t: 0.24 },
      { f: 1046.50, d: 0.35, t: 0.36 },
      { f: 880.00, d: 0.12, t: 0.75 },
      { f: 1046.50, d: 0.6, t: 0.9 }
    ];

    melody.forEach(note => {
      const now = this.ctx.currentTime + note.t;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + note.d);
    });
  }

  // 긴장감 심장박동 (쿵-쿵)
  playHeartbeat() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

window.soundManager = new SoundManager();
