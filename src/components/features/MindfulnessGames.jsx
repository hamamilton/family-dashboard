import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Wind,
  Waves,
  Heart,
  Maximize2,
  Minimize2,
  Palette
} from 'lucide-react';

// Gentle Web Audio synthesizer using pentatonic notes & soft singing-bowl harmonics
class CalmAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft singing bowl chime on breath phase changes
  playBreathTone(phase) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const freqMap = {
      inhale: 261.63, // C4
      hold: 329.63,   // E4
      exhale: 196.0,  // G3
      rest: 220.0     // A3
    };
    const freq = freqMap[phase] || 261.63;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.8);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 1.85);
    osc2.stop(now + 1.85);
  }

  // Pentatonic kalimba/harp chime for bubble pops and water ripples
  playPentatonicChime(sizeRatio = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // C4, D4, E4, G4, A4, C5, D5, E5, G5
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
    const index = Math.min(
      scale.length - 1,
      Math.max(0, Math.floor((1 - sizeRatio) * scale.length))
    );
    const freq = scale[index];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.95);
  }
}

const calmAudio = new CalmAudio();

const CALM_PALETTES = [
  {
    name: 'Ocean Breeze',
    primary: '#38bdf8',
    secondary: '#2dd4bf',
    accent: '#818cf8',
    glow: 'rgba(56, 189, 248, 0.28)'
  },
  {
    name: 'Twilight Lavender',
    primary: '#a78bfa',
    secondary: '#f472b6',
    accent: '#60a5fa',
    glow: 'rgba(167, 139, 250, 0.28)'
  },
  {
    name: 'Forest Sanctuary',
    primary: '#34d399',
    secondary: '#a3e635',
    accent: '#38bdf8',
    glow: 'rgba(52, 211, 153, 0.28)'
  },
  {
    name: 'Warm Sunset',
    primary: '#fb923c',
    secondary: '#f43f5e',
    accent: '#fbbf24',
    glow: 'rgba(251, 146, 60, 0.28)'
  }
];

const BREATH_PATTERNS = [
  {
    id: 'flower',
    name: 'Flower & Candle',
    subtitle: 'Kid-Friendly (4s In • 6s Out)',
    phases: [
      { key: 'inhale', label: 'Smell the Flower...', sub: 'Breathe in slowly through your nose', duration: 4 },
      { key: 'exhale', label: 'Blow the Candle...', sub: 'Blow out gently through your mouth', duration: 6 }
    ]
  },
  {
    id: 'box',
    name: 'Box Breathing',
    subtitle: 'Steady Focus (4s • 4s • 4s • 4s)',
    phases: [
      { key: 'inhale', label: 'Breathe In...', sub: 'Fill your lungs slowly', duration: 4 },
      { key: 'hold', label: 'Hold Gently...', sub: 'Keep your shoulders relaxed', duration: 4 },
      { key: 'exhale', label: 'Breathe Out...', sub: 'Let all the tension go', duration: 4 },
      { key: 'rest', label: 'Rest Calmly...', sub: 'Notice how quiet your body feels', duration: 4 }
    ]
  },
  {
    id: '478',
    name: '4-7-8 Deep Calm',
    subtitle: 'Deep Reset (4s In • 7s Hold • 8s Out)',
    phases: [
      { key: 'inhale', label: 'Breathe In Quietly...', sub: 'Inhale through your nose', duration: 4 },
      { key: 'hold', label: 'Hold & Soften...', sub: 'Relax your jaw and hands', duration: 7 },
      { key: 'exhale', label: 'Long Slow Exhale...', sub: 'Whoosh all the air out', duration: 8 }
    ]
  }
];

const FEELING_CHIPS = [
  '😤 Frustrated',
  '🔊 Too Loud',
  '😠 Mad',
  '😟 Worried',
  '😢 Sad',
  '🌀 Overwhelmed'
];

// ============================================================================
// 1. BREATHING ORB COMPONENT
// ============================================================================
export function BreathingOrb({ isDarkMode = true }) {
  const [patternIdx, setPatternIdx] = useState(0);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [muted, setMuted] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [isFullViewport, setIsFullViewport] = useState(false);
  const [uiPhase, setUiPhase] = useState({
    label: BREATH_PATTERNS[0].phases[0].label,
    sub: BREATH_PATTERNS[0].phases[0].sub,
    secondsLeft: BREATH_PATTERNS[0].phases[0].duration,
    key: 'inhale'
  });

  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const stateRef = useRef({
    phaseIndex: 0,
    phaseElapsed: 0,
    lastTimestamp: null,
    scale: 0.38,
    particles: Array.from({ length: 36 }, (_, i) => ({
      angle: (i / 36) * Math.PI * 2,
      radiusOffset: (i % 5) * 0.14 + 0.2,
      speed: 0.25 + (i % 4) * 0.08,
      size: 2.5 + (i % 3) * 1.5
    }))
  });

  const pattern = BREATH_PATTERNS[patternIdx];
  const palette = CALM_PALETTES[paletteIdx];

  const resetSession = useCallback((newPatternIdx = patternIdx) => {
    const p = BREATH_PATTERNS[newPatternIdx];
    stateRef.current.phaseIndex = 0;
    stateRef.current.phaseElapsed = 0;
    stateRef.current.lastTimestamp = null;
    stateRef.current.scale = 0.38;
    setUiPhase({
      label: p.phases[0].label,
      sub: p.phases[0].sub,
      secondsLeft: p.phases[0].duration,
      key: p.phases[0].key
    });
  }, [patternIdx]);

  const handlePatternChange = (idx) => {
    setPatternIdx(idx);
    resetSession(idx);
  };

  const toggleSound = () => {
    calmAudio.muted = !muted;
    setMuted(!muted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      const size = Math.max(180, Math.floor(Math.min(rect.width - 16, rect.height - 16)));
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(wrapper);
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, [isFullViewport]);

  useEffect(() => {
    let lastSecondReported = -1;
    let lastPhaseReported = '';

    const render = (timestamp) => {
      const s = stateRef.current;
      const activePattern = BREATH_PATTERNS[patternIdx];
      const activePalette = CALM_PALETTES[paletteIdx];
      const phases = activePattern.phases;
      const currentPhase = phases[s.phaseIndex] || phases[0];

      if (s.lastTimestamp === null) {
        s.lastTimestamp = timestamp;
      }
      const dt = Math.min(0.1, (timestamp - s.lastTimestamp) / 1000);
      s.lastTimestamp = timestamp;

      if (isRunning) {
        s.phaseElapsed += dt;
        if (s.phaseElapsed >= currentPhase.duration) {
          s.phaseElapsed = 0;
          const nextIdx = (s.phaseIndex + 1) % phases.length;
          if (nextIdx === 0) {
            setBreathCount(c => c + 1);
          }
          s.phaseIndex = nextIdx;
          calmAudio.playBreathTone(phases[nextIdx].key);
        }
      }

      const phaseNow = phases[s.phaseIndex] || phases[0];
      const progress = Math.min(1, Math.max(0, s.phaseElapsed / phaseNow.duration));
      // Smooth cosine easing
      const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);

      const minScale = 0.36;
      const maxScale = 0.88;
      if (phaseNow.key === 'inhale') {
        s.scale = minScale + (maxScale - minScale) * eased;
      } else if (phaseNow.key === 'hold') {
        s.scale = maxScale + Math.sin(progress * Math.PI * 2) * 0.015;
      } else if (phaseNow.key === 'exhale') {
        s.scale = maxScale - (maxScale - minScale) * eased;
      } else {
        s.scale = minScale + Math.sin(progress * Math.PI * 2) * 0.012;
      }

      const secsLeft = Math.max(1, Math.ceil(phaseNow.duration - s.phaseElapsed));
      if (secsLeft !== lastSecondReported || phaseNow.key !== lastPhaseReported) {
        lastSecondReported = secsLeft;
        lastPhaseReported = phaseNow.key;
        setUiPhase({
          label: phaseNow.label,
          sub: phaseNow.sub,
          secondsLeft: secsLeft,
          key: phaseNow.key
        });
      }

      // Draw Orb on Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const width = parseFloat(canvas.style.width) || 320;
        const height = parseFloat(canvas.style.height) || 320;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(cx, cy) * 0.88;
        const orbR = maxR * s.scale;

        ctx.clearRect(0, 0, width, height);

        // Outer guide ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.88, 0, Math.PI * 2);
        ctx.strokeStyle = isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.restore();

        // Phase progress arc on outer guide ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          maxR * 0.88,
          -Math.PI / 2,
          -Math.PI / 2 + progress * Math.PI * 2
        );
        ctx.strokeStyle = activePalette.primary;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Soft ambient aura layers
        for (let layer = 3; layer >= 1; layer--) {
          const r = orbR * (1 + layer * 0.16);
          const grad = ctx.createRadialGradient(cx, cy, orbR * 0.15, cx, cy, r);
          grad.addColorStop(0, activePalette.primary + '44');
          grad.addColorStop(0.6, activePalette.secondary + '22');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Translucent lotus petals
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 + timestamp * 0.00025;
          const px = cx + Math.cos(angle) * (orbR * 0.24);
          const py = cy + Math.sin(angle) * (orbR * 0.24);
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, orbR * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? activePalette.primary + '26' : activePalette.secondary + '26';
          ctx.fill();
          ctx.restore();
        }

        // Core glowing orb
        const coreGrad = ctx.createRadialGradient(
          cx - orbR * 0.2,
          cy - orbR * 0.2,
          orbR * 0.1,
          cx,
          cy,
          orbR
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.35, activePalette.primary);
        coreGrad.addColorStop(1, activePalette.secondary);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = activePalette.primary;
        ctx.shadowBlur = 28;
        ctx.fill();
        ctx.restore();

        // Floating calm firefly particles
        s.particles.forEach((pt) => {
          pt.angle += 0.003 * pt.speed;
          const dist = maxR * (0.25 + s.scale * 0.65 * pt.radiusOffset);
          const x = cx + Math.cos(pt.angle) * dist;
          const y = cy + Math.sin(pt.angle) * dist;
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffffcc';
          ctx.fill();
          ctx.restore();
        });

        // Countdown & phase cue in center of orb
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.font = `900 ${Math.max(24, Math.floor(maxR * 0.24))}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${secsLeft}`, cx, cy);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [patternIdx, paletteIdx, isRunning, isDarkMode]);

  return (
    <div
      className={`flex flex-col items-center justify-between w-full h-full min-h-0 p-2 sm:p-3 select-none gap-2 overflow-hidden ${
        isFullViewport ? 'fixed inset-0 z-50 bg-slate-950' : ''
      }`}
    >
      {/* Top Controls Bar */}
      <div className="w-full flex-none flex flex-wrap items-center justify-between gap-2 bg-slate-900/70 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-sm"
            style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
          >
            <Wind size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
              BREATHING ORB
            </h2>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Follow the glowing orb to slow your heart rate & reset
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Pattern Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            {BREATH_PATTERNS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handlePatternChange(idx)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  patternIdx === idx
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Color Palette Toggle */}
          <button
            onClick={() => setPaletteIdx((paletteIdx + 1) % CALM_PALETTES.length)}
            title={`Color Theme: ${palette.name}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.primary }} />
            <span className="w-3 h-3 rounded-full -ml-1.5 ring-2 ring-slate-900" style={{ backgroundColor: palette.secondary }} />
            <Palette size={14} className="hidden sm:inline" />
          </button>

          {/* Chime Mute Toggle */}
          <button
            onClick={toggleSound}
            title="Toggle Singing Bowl Chimes"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {muted ? <VolumeX size={15} className="text-slate-500" /> : <Volume2 size={15} />}
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsRunning(r => !r)}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1 text-xs font-bold"
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Reset Counter */}
          <button
            onClick={() => {
              setBreathCount(0);
              resetSession();
            }}
            title="Reset Breath Counter"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <RotateCcw size={14} />
          </button>

          {/* Full Viewport Toggle */}
          <button
            onClick={() => setIsFullViewport(prev => !prev)}
            title={isFullViewport ? 'Exit Full Screen Overlay' : 'Expand Over Entire Screen'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {isFullViewport ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Guidance Prompt Banner */}
      <div className="w-full flex-none flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-2xl">
        <div className="text-center sm:text-left">
          <div className="text-base sm:text-lg font-black text-white tracking-wide" style={{ color: palette.primary }}>
            {uiPhase.label}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {uiPhase.sub}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {pattern.subtitle}
          </span>
          <div className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-1.5">
            <Heart size={13} className="text-rose-400" />
            <span className="text-xs font-black text-white">{breathCount}</span>
            <span className="text-[11px] text-slate-400 font-bold">Calm Breaths</span>
          </div>
        </div>
      </div>

      {/* Center Canvas Container (Strictly bounded to remaining window height) */}
      <div
        ref={wrapperRef}
        className={`flex-1 min-h-0 min-w-0 w-full h-full rounded-2xl border relative overflow-hidden ${
          isDarkMode
            ? 'bg-slate-950/90 border-slate-800'
            : 'bg-slate-900 border-slate-300'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            onClick={() => calmAudio.playBreathTone(uiPhase.key)}
            className="cursor-pointer touch-none block"
          />
        </div>
      </div>

      <p className="flex-none text-center text-[11px] text-slate-400 font-medium">
        Tip: Try 5 slow breaths together. Tap the orb anytime to hear a soft singing-bowl tone.
      </p>
    </div>
  );
}

// ============================================================================
// 2. ZEN RIPPLE & BUBBLE POP SANCTUARY
// ============================================================================
export function ZenRippleBubbles({ isDarkMode = true }) {
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [poppedCount, setPoppedCount] = useState(0);
  const [customWorry, setCustomWorry] = useState('');
  const [isFullViewport, setIsFullViewport] = useState(false);

  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const palette = CALM_PALETTES[paletteIdx];

  const worldRef = useRef({
    width: 600,
    height: 450,
    bubbles: [],
    ripples: [],
    sparkles: [],
    lastDragRipple: 0
  });

  const makeBubble = useCallback((w, h, startAtBottom = false, label = '') => {
    const r = label ? Math.max(46, Math.min(68, label.length * 3.8 + 26)) : 24 + Math.random() * 28;
    return {
      x: r + Math.random() * Math.max(40, w - r * 2),
      y: startAtBottom ? h + r + Math.random() * 40 : Math.random() * h,
      r,
      vy: 0.35 + Math.random() * 0.55,
      wobbleAmp: 0.4 + Math.random() * 0.8,
      wobbleSpeed: 0.015 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      hueShift: Math.random(),
      label
    };
  }, []);

  const spawnWorryBubble = (text) => {
    const clean = (text || '').trim();
    if (!clean) return;
    const w = worldRef.current;
    w.bubbles.push({
      x: w.width * (0.25 + Math.random() * 0.5),
      y: w.height - 40,
      r: Math.max(50, Math.min(76, clean.length * 3.5 + 28)),
      vy: 0.42,
      wobbleAmp: 0.6,
      wobbleSpeed: 0.018,
      phase: Math.random() * Math.PI * 2,
      hueShift: 0.5,
      label: clean
    });
    calmAudio.playPentatonicChime(0.3);
  };

  const popBubbleAt = (b, idx) => {
    const w = worldRef.current;
    w.bubbles.splice(idx, 1);
    setPoppedCount(c => c + 1);

    // Spawn concentric ripple
    w.ripples.push({
      x: b.x,
      y: b.y,
      r: b.r * 0.5,
      maxR: b.r * 2.8,
      alpha: 0.85
    });

    // Spawn starlight sparkles
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 1.2 + Math.random() * 2.6;
      w.sparkles.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 2.5,
        alpha: 1
      });
    }

    calmAudio.playPentatonicChime(Math.min(1, b.r / 65));
  };

  const handlePointerTap = (clientX, clientY, isDrag = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const w = worldRef.current;

    // Check if pointer hit any bubble (top-most first)
    for (let i = w.bubbles.length - 1; i >= 0; i--) {
      const b = w.bubbles[i];
      const dist = Math.hypot(x - b.x, y - b.y);
      if (dist <= b.r + 8) {
        popBubbleAt(b, i);
        return;
      }
    }

    // Otherwise create a soothing water ripple
    const now = performance.now();
    if (!isDrag || now - w.lastDragRipple > 90) {
      w.lastDragRipple = now;
      w.ripples.push({
        x,
        y,
        r: 6,
        maxR: isDrag ? 75 : 120,
        alpha: isDrag ? 0.55 : 0.75
      });
      if (!isDrag) {
        calmAudio.playPentatonicChime(y / Math.max(1, w.height));
      }
    }
  };

  const toggleSound = () => {
    calmAudio.muted = !muted;
    setMuted(!muted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(240, Math.floor(rect.width));
      const h = Math.max(200, Math.floor(rect.height));

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      worldRef.current.width = w;
      worldRef.current.height = h;

      if (worldRef.current.bubbles.length === 0) {
        worldRef.current.bubbles = Array.from({ length: 14 }, () => makeBubble(w, h, false));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(wrapper);
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, [makeBubble, isFullViewport]);

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = worldRef.current;
      const activePalette = CALM_PALETTES[paletteIdx];

      ctx.clearRect(0, 0, w.width, w.height);

      // Keep 14 gentle bubbles floating at all times
      while (w.bubbles.length < 14) {
        w.bubbles.push(makeBubble(w.width, w.height, true));
      }

      // 1. Update & Draw Water Ripples
      for (let i = w.ripples.length - 1; i >= 0; i--) {
        const rp = w.ripples[i];
        rp.r += 1.65;
        rp.alpha *= 0.965;

        ctx.save();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = activePalette.primary;
        ctx.globalAlpha = Math.max(0, rp.alpha);
        ctx.lineWidth = 2.2;
        ctx.stroke();

        if (rp.r > 18) {
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.r * 0.68, 0, Math.PI * 2);
          ctx.strokeStyle = activePalette.secondary;
          ctx.globalAlpha = Math.max(0, rp.alpha * 0.6);
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        ctx.restore();

        if (rp.alpha < 0.03 || rp.r >= rp.maxR) {
          w.ripples.splice(i, 1);
        }
      }

      // 2. Update & Draw Floating Bubbles
      for (let i = w.bubbles.length - 1; i >= 0; i--) {
        const b = w.bubbles[i];
        b.phase += b.wobbleSpeed;
        b.y -= b.vy;
        b.x += Math.sin(b.phase) * b.wobbleAmp;

        if (b.y < -b.r - 10) {
          w.bubbles[i] = makeBubble(w.width, w.height, true);
          continue;
        }

        const color = b.hueShift > 0.5 ? activePalette.primary : activePalette.secondary;

        ctx.save();
        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.3,
          b.y - b.r * 0.3,
          b.r * 0.1,
          b.x,
          b.y,
          b.r
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(0.35, color + '55');
        grad.addColorStop(0.85, color + '33');
        grad.addColorStop(1, color + '88');

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = b.label ? 2.5 : 1.5;
        ctx.strokeStyle = b.label ? '#ffffffcc' : color + 'aa';
        ctx.stroke();

        // Glossy highlight dot
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fill();

        // Optional Worry Label inside Bubble
        if (b.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.label, b.x, b.y);
        }

        ctx.restore();
      }

      // 3. Update & Draw Starlight Sparkles
      for (let i = w.sparkles.length - 1; i >= 0; i--) {
        const sp = w.sparkles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.alpha *= 0.93;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.fill();
        ctx.restore();

        if (sp.alpha < 0.04) {
          w.sparkles.splice(i, 1);
        }
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [paletteIdx, makeBubble]);

  return (
    <div
      className={`flex flex-col items-center justify-between w-full h-full min-h-0 p-2 sm:p-3 select-none gap-2 overflow-hidden ${
        isFullViewport ? 'fixed inset-0 z-50 bg-slate-950' : ''
      }`}
    >
      {/* Top Controls Bar */}
      <div className="w-full flex-none flex flex-wrap items-center justify-between gap-2 bg-slate-900/70 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-sm"
            style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
          >
            <Waves size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
              ZEN RIPPLES & BUBBLE POP
            </h2>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Tap bubbles to pop them with harp chimes, or drag across the pond to make ripples
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            <span className="text-xs font-black text-white">{poppedCount}</span>
            <span className="text-[11px] text-slate-400 font-bold">Popped</span>
          </div>

          {/* Color Palette Toggle */}
          <button
            onClick={() => setPaletteIdx((paletteIdx + 1) % CALM_PALETTES.length)}
            title={`Color Theme: ${palette.name}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.primary }} />
            <span className="w-3 h-3 rounded-full -ml-1.5 ring-2 ring-slate-900" style={{ backgroundColor: palette.secondary }} />
            <Palette size={14} className="hidden sm:inline" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title="Toggle Harp Chimes"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {muted ? <VolumeX size={15} className="text-slate-500" /> : <Volume2 size={15} />}
          </button>

          {/* Clear & Refresh Pond */}
          <button
            onClick={() => {
              worldRef.current.bubbles = [];
              worldRef.current.ripples = [];
              setPoppedCount(0);
            }}
            title="Reset Pond"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <RotateCcw size={14} />
          </button>

          {/* Full Viewport Toggle */}
          <button
            onClick={() => setIsFullViewport(prev => !prev)}
            title={isFullViewport ? 'Exit Full Screen Overlay' : 'Expand Over Entire Screen'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {isFullViewport ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Worry Cloud / Feeling Bubble Launcher Bar */}
      <div className="w-full flex-none flex flex-wrap items-center justify-between gap-2 bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1">
            Put a big feeling in a bubble & pop it:
          </span>
          {FEELING_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => spawnWorryBubble(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            if (customWorry.trim()) {
              spawnWorryBubble(customWorry);
              setCustomWorry('');
            }
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={customWorry}
            maxLength={22}
            onChange={e => setCustomWorry(e.target.value)}
            placeholder="Or type a worry..."
            className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-colors"
          >
            Float It
          </button>
        </form>
      </div>

      {/* Interactive Pond Canvas (Fills remaining height 100%) */}
      <div
        ref={wrapperRef}
        className={`flex-1 min-h-0 min-w-0 w-full h-full rounded-2xl border relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800'
            : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-slate-300'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={e => handlePointerTap(e.clientX, e.clientY, false)}
          onMouseMove={e => {
            if (e.buttons === 1) handlePointerTap(e.clientX, e.clientY, true);
          }}
          onTouchStart={e => {
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
              handlePointerTap(e.touches[i].clientX, e.touches[i].clientY, false);
            }
          }}
          onTouchMove={e => {
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
              handlePointerTap(e.touches[i].clientX, e.touches[i].clientY, true);
            }
          }}
          className="block w-full h-full cursor-pointer touch-none"
        />
      </div>
    </div>
  );
}
