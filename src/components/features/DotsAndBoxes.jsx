import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Undo2, RotateCcw, Palette, Users, Trophy, Maximize2, Minimize2 } from 'lucide-react';

const THEMES = [
  {
    name: 'Coral vs Ocean',
    p1: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.22)', dark: '#be123c' },
    p2: { main: '#0ea5e9', light: 'rgba(14, 165, 233, 0.22)', dark: '#0369a1' }
  },
  {
    name: 'Emerald vs Violet',
    p1: { main: '#10b981', light: 'rgba(16, 185, 129, 0.22)', dark: '#047857' },
    p2: { main: '#8b5cf6', light: 'rgba(139, 92, 246, 0.22)', dark: '#6d28d9' }
  },
  {
    name: 'Amber vs Indigo',
    p1: { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.24)', dark: '#b45309' },
    p2: { main: '#6366f1', light: 'rgba(99, 102, 241, 0.22)', dark: '#3730a3' }
  },
  {
    name: 'Magenta vs Teal',
    p1: { main: '#ec4899', light: 'rgba(236, 72, 153, 0.22)', dark: '#be185d' },
    p2: { main: '#14b8a6', light: 'rgba(20, 184, 166, 0.22)', dark: '#0f766e' }
  }
];

class SoundFX {
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

  playLine(player) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = player === 1 ? 420 : 360;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playBox(comboCount = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = comboCount > 1 ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const startTime = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.23);
    });
  }

  playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.62];

    melody.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + times[i];
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.31);
    });
  }

  playUndo() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }
}

const sfx = new SoundFX();

function getInitials(name, fallback) {
  const clean = (name || '').trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function DotsAndBoxes({ profiles = [], isDarkMode = true }) {
  const [gridSize, setGridSize] = useState(5);
  const [themeIdx, setThemeIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [scoreBump, setScoreBump] = useState(null);
  const [names, setNames] = useState({ 1: 'Player 1', 2: 'Player 2' });
  const [selectedProfiles, setSelectedProfiles] = useState({ 1: '', 2: '' });
  const [historyCount, setHistoryCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isFullViewport, setIsFullViewport] = useState(false);
  const [toast, setToast] = useState({ visible: false, text: '', player: 1 });

  // Default to first two profiles when profiles load
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfiles[1] && !selectedProfiles[2]) {
      const p1 = profiles[0];
      const p2 = profiles[1] || null;
      setSelectedProfiles({
        1: p1 ? p1.id : 'custom',
        2: p2 ? p2.id : 'custom'
      });
      setNames({
        1: p1 ? p1.name : 'Player 1',
        2: p2 ? p2.name : 'Player 2'
      });
    }
  }, [profiles, selectedProfiles]);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const toastTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Mutable board state for high-fps canvas rendering
  const boardRef = useRef({
    gridSize: 5,
    currentPlayer: 1,
    scores: { 1: 0, 2: 0 },
    hLines: [],
    vLines: [],
    boxes: [],
    boxAnim: [],
    lastMove: null,
    hoverEdge: null,
    history: [],
    gameOver: false,
    layout: {
      width: 300,
      height: 300,
      padding: 28,
      cellSize: 50,
      dotRadius: 6,
      lineThickness: 6
    }
  });

  const theme = THEMES[themeIdx];

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const b = boardRef.current;
    const { width, height, padding, cellSize, dotRadius, lineThickness } = b.layout;
    const n = b.gridSize;
    const activeTheme = THEMES[themeIdx];

    ctx.clearRect(0, 0, width, height);

    const p1Init = getInitials(names[1], 'P1');
    const p2Init = getInitials(names[2], 'P2');

    // 1. Draw Claimed Boxes
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const owner = b.boxes[r]?.[c] || 0;
        if (owner !== 0) {
          const progress = b.boxAnim[r]?.[c] || 1;
          const scale = 0.65 + 0.35 * (1 - Math.pow(1 - progress, 3));
          const x = padding + c * cellSize;
          const y = padding + r * cellSize;
          const inset = lineThickness * 0.65;
          const boxW = cellSize - inset * 2;

          ctx.save();
          ctx.translate(x + cellSize / 2, y + cellSize / 2);
          ctx.scale(scale, scale);
          ctx.globalAlpha = progress;

          ctx.fillStyle = owner === 1 ? activeTheme.p1.light : activeTheme.p2.light;
          roundRect(ctx, -boxW / 2, -boxW / 2, boxW, boxW, Math.max(6, cellSize * 0.14));
          ctx.fill();

          ctx.fillStyle = owner === 1 ? activeTheme.p1.main : activeTheme.p2.main;
          ctx.font = `700 ${Math.floor(cellSize * 0.34)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(owner === 1 ? p1Init : p2Init, 0, 1);

          ctx.restore();
        }
      }
    }

    // 2. Draw Unclaimed Guide Dashed Lines
    ctx.save();
    ctx.strokeStyle = isDarkMode ? '#334155' : '#cbd5e1';
    ctx.lineWidth = Math.max(2, lineThickness * 0.42);
    ctx.setLineDash([4, 5]);
    ctx.lineCap = 'round';

    for (let r = 0; r <= n; r++) {
      for (let c = 0; c < n; c++) {
        if (b.hLines[r]?.[c] === 0) {
          const x1 = padding + c * cellSize + dotRadius * 1.4;
          const x2 = padding + (c + 1) * cellSize - dotRadius * 1.4;
          const y = padding + r * cellSize;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      }
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n; c++) {
        if (b.vLines[r]?.[c] === 0) {
          const x = padding + c * cellSize;
          const y1 = padding + r * cellSize + dotRadius * 1.4;
          const y2 = padding + (r + 1) * cellSize - dotRadius * 1.4;
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // 3. Draw Hover Preview Line
    if (b.hoverEdge && !b.gameOver) {
      const { type, r, c } = b.hoverEdge;
      const pColor = b.currentPlayer === 1 ? activeTheme.p1.main : activeTheme.p2.main;
      ctx.save();
      ctx.strokeStyle = pColor;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = lineThickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      if (type === 'h') {
        ctx.moveTo(padding + c * cellSize, padding + r * cellSize);
        ctx.lineTo(padding + (c + 1) * cellSize, padding + r * cellSize);
      } else {
        ctx.moveTo(padding + c * cellSize, padding + r * cellSize);
        ctx.lineTo(padding + c * cellSize, padding + (r + 1) * cellSize);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Claimed Lines
    const drawClaimedLine = (x1, y1, x2, y2, owner, isLast) => {
      const color = owner === 1 ? activeTheme.p1.main : activeTheme.p2.main;
      ctx.save();
      ctx.lineCap = 'round';
      if (isLast) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = lineThickness + 2;
      } else {
        ctx.lineWidth = lineThickness;
      }
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (isLast) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = Math.max(2, lineThickness * 0.3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    };

    for (let r = 0; r <= n; r++) {
      for (let c = 0; c < n; c++) {
        const owner = b.hLines[r]?.[c] || 0;
        if (owner !== 0) {
          const isLast = b.lastMove && b.lastMove.type === 'h' && b.lastMove.r === r && b.lastMove.c === c;
          drawClaimedLine(
            padding + c * cellSize,
            padding + r * cellSize,
            padding + (c + 1) * cellSize,
            padding + r * cellSize,
            owner,
            isLast
          );
        }
      }
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n; c++) {
        const owner = b.vLines[r]?.[c] || 0;
        if (owner !== 0) {
          const isLast = b.lastMove && b.lastMove.type === 'v' && b.lastMove.r === r && b.lastMove.c === c;
          drawClaimedLine(
            padding + c * cellSize,
            padding + r * cellSize,
            padding + c * cellSize,
            padding + (r + 1) * cellSize,
            owner,
            isLast
          );
        }
      }
    }

    // 5. Draw Dots on Top
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c <= n; c++) {
        const cx = padding + c * cellSize;
        const cy = padding + r * cellSize;

        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
        ctx.fill();
      }
    }
  }, [themeIdx, names, isDarkMode]);

  const startAnimationLoop = useCallback(() => {
    if (animFrameRef.current) return;
    const step = () => {
      const b = boardRef.current;
      let needsMore = false;
      for (let r = 0; r < b.gridSize; r++) {
        for (let c = 0; c < b.gridSize; c++) {
          if (b.boxes[r][c] !== 0 && b.boxAnim[r][c] < 1) {
            b.boxAnim[r][c] = Math.min(1, b.boxAnim[r][c] + 0.09);
            needsMore = true;
          }
        }
      }
      renderCanvas();
      if (needsMore) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [renderCanvas]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const style = window.getComputedStyle(wrapper);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const availW = Math.max(220, rect.width - padX);
    const availH = Math.max(220, rect.height - padY);
    const size = Math.max(220, Math.min(900, Math.floor(Math.min(availW, availH))));

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = boardRef.current.gridSize;
    const edgePad = Math.max(20, size * 0.065);
    const usable = size - edgePad * 2;
    const cellSize = usable / n;

    boardRef.current.layout = {
      width: size,
      height: size,
      padding: edgePad,
      cellSize,
      dotRadius: Math.max(4.5, Math.min(11, cellSize * 0.11)),
      lineThickness: Math.max(5, Math.min(13, cellSize * 0.13))
    };

    renderCanvas();
  }, [renderCanvas]);

  const initGame = useCallback((size = gridSize) => {
    const b = boardRef.current;
    b.gridSize = size;
    b.currentPlayer = 1;
    b.scores = { 1: 0, 2: 0 };
    b.lastMove = null;
    b.hoverEdge = null;
    b.history = [];
    b.gameOver = false;
    b.hLines = Array.from({ length: size + 1 }, () => Array(size).fill(0));
    b.vLines = Array.from({ length: size }, () => Array(size + 1).fill(0));
    b.boxes = Array.from({ length: size }, () => Array(size).fill(0));
    b.boxAnim = Array.from({ length: size }, () => Array(size).fill(0));

    setGridSize(size);
    setCurrentPlayer(1);
    setScores({ 1: 0, 2: 0 });
    setHistoryCount(0);
    setGameOver(false);
    setShowModal(false);

    setTimeout(() => resizeCanvas(), 0);
  }, [gridSize, resizeCanvas]);

  useEffect(() => {
    initGame(5);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    let observer;
    if (wrapperRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => resizeCanvas());
      observer.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (observer) observer.disconnect();
    };
  }, [resizeCanvas, isFullViewport]);

  useEffect(() => {
    renderCanvas();
  }, [themeIdx, names, isDarkMode, renderCanvas]);

  const findNearestEdge = (x, y) => {
    const b = boardRef.current;
    if (b.gameOver) return null;

    const { padding, cellSize } = b.layout;
    const n = b.gridSize;
    const hitThreshold = cellSize * 0.36;

    let bestEdge = null;
    let minDist = hitThreshold;

    for (let r = 0; r <= n; r++) {
      const ey = padding + r * cellSize;
      if (Math.abs(y - ey) > minDist) continue;
      for (let c = 0; c < n; c++) {
        if (b.hLines[r][c] !== 0) continue;
        const x1 = padding + c * cellSize;
        const x2 = x1 + cellSize;
        const clampedX = Math.max(x1, Math.min(x2, x));
        const dist = Math.hypot(x - clampedX, y - ey);
        if (dist < minDist) {
          minDist = dist;
          bestEdge = { type: 'h', r, c };
        }
      }
    }

    for (let c = 0; c <= n; c++) {
      const ex = padding + c * cellSize;
      if (Math.abs(x - ex) > minDist) continue;
      for (let r = 0; r < n; r++) {
        if (b.vLines[r][c] !== 0) continue;
        const y1 = padding + r * cellSize;
        const y2 = y1 + cellSize;
        const clampedY = Math.max(y1, Math.min(y2, y));
        const dist = Math.hypot(x - ex, y - clampedY);
        if (dist < minDist) {
          minDist = dist;
          bestEdge = { type: 'v', r, c };
        }
      }
    }

    return bestEdge;
  };

  const triggerExtraTurnToast = (boxesCount, player) => {
    const text = boxesCount > 1 ? `🔥 +${boxesCount} Boxes! Extra Turn!` : `✨ +1 Box! Extra Turn!`;
    setToast({ visible: true, text, player });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 1500);
  };

  const claimEdge = (edge) => {
    const b = boardRef.current;
    if (!edge || b.gameOver) return;
    const { type, r, c } = edge;

    if (type === 'h' && b.hLines[r][c] !== 0) return;
    if (type === 'v' && b.vLines[r][c] !== 0) return;

    b.history.push({
      currentPlayer: b.currentPlayer,
      scores: { ...b.scores },
      hLines: b.hLines.map(row => [...row]),
      vLines: b.vLines.map(row => [...row]),
      boxes: b.boxes.map(row => [...row]),
      lastMove: b.lastMove ? { ...b.lastMove } : null
    });
    setHistoryCount(b.history.length);

    const player = b.currentPlayer;
    if (type === 'h') {
      b.hLines[r][c] = player;
    } else {
      b.vLines[r][c] = player;
    }

    b.lastMove = { type, r, c };
    b.hoverEdge = null;

    // Check completed boxes
    const n = b.gridSize;
    let completed = 0;
    const isBoxComplete = (br, bc) => {
      if (br < 0 || br >= n || bc < 0 || bc >= n) return false;
      return (
        b.hLines[br][bc] !== 0 &&
        b.hLines[br + 1][bc] !== 0 &&
        b.vLines[br][bc] !== 0 &&
        b.vLines[br][bc + 1] !== 0
      );
    };

    if (type === 'h') {
      if (r > 0 && b.boxes[r - 1][c] === 0 && isBoxComplete(r - 1, c)) {
        b.boxes[r - 1][c] = player;
        b.boxAnim[r - 1][c] = 0.05;
        completed++;
      }
      if (r < n && b.boxes[r][c] === 0 && isBoxComplete(r, c)) {
        b.boxes[r][c] = player;
        b.boxAnim[r][c] = 0.05;
        completed++;
      }
    } else {
      if (c > 0 && b.boxes[r][c - 1] === 0 && isBoxComplete(r, c - 1)) {
        b.boxes[r][c - 1] = player;
        b.boxAnim[r][c - 1] = 0.05;
        completed++;
      }
      if (c < n && b.boxes[r][c] === 0 && isBoxComplete(r, c)) {
        b.boxes[r][c] = player;
        b.boxAnim[r][c] = 0.05;
        completed++;
      }
    }

    if (completed > 0) {
      b.scores[player] += completed;
      setScores({ ...b.scores });
      setScoreBump(player);
      setTimeout(() => setScoreBump(null), 350);
      sfx.playBox(completed);

      const totalBoxes = n * n;
      if (b.scores[1] + b.scores[2] === totalBoxes) {
        b.gameOver = true;
        setGameOver(true);
        sfx.playWin();
        setTimeout(() => setShowModal(true), 500);
      } else {
        triggerExtraTurnToast(completed, player);
      }
    } else {
      sfx.playLine(player);
      b.currentPlayer = player === 1 ? 2 : 1;
      setCurrentPlayer(b.currentPlayer);
    }

    startAnimationLoop();
  };

  const undoMove = () => {
    const b = boardRef.current;
    if (b.history.length === 0) return;
    const prev = b.history.pop();
    b.currentPlayer = prev.currentPlayer;
    b.scores = prev.scores;
    b.hLines = prev.hLines;
    b.vLines = prev.vLines;
    b.boxes = prev.boxes;
    b.lastMove = prev.lastMove;
    b.gameOver = false;
    b.hoverEdge = null;

    for (let r = 0; r < b.gridSize; r++) {
      for (let c = 0; c < b.gridSize; c++) {
        b.boxAnim[r][c] = b.boxes[r][c] !== 0 ? 1 : 0;
      }
    }

    setCurrentPlayer(b.currentPlayer);
    setScores({ ...b.scores });
    setHistoryCount(b.history.length);
    setGameOver(false);
    setShowModal(false);
    sfx.playUndo();
    renderCanvas();
  };

  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseMove = (e) => {
    const pos = getPointerPos(e);
    const nearest = findNearestEdge(pos.x, pos.y);
    const prev = boardRef.current.hoverEdge;
    const changed =
      (!nearest && prev) ||
      (nearest && !prev) ||
      (nearest && prev && (nearest.type !== prev.type || nearest.r !== prev.r || nearest.c !== prev.c));

    if (changed) {
      boardRef.current.hoverEdge = nearest;
      renderCanvas();
    }
  };

  const handleMouseLeave = () => {
    if (boardRef.current.hoverEdge) {
      boardRef.current.hoverEdge = null;
      renderCanvas();
    }
  };

  const handleClick = (e) => {
    const pos = getPointerPos(e);
    const edge = findNearestEdge(pos.x, pos.y);
    if (edge) claimEdge(edge);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    boardRef.current.hoverEdge = findNearestEdge(pos.x, pos.y);
    renderCanvas();
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    boardRef.current.hoverEdge = findNearestEdge(pos.x, pos.y);
    renderCanvas();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (boardRef.current.hoverEdge) {
      claimEdge(boardRef.current.hoverEdge);
    }
  };

  const handleProfileChange = (playerNum, profileId) => {
    setSelectedProfiles(prev => ({ ...prev, [playerNum]: profileId }));
    if (profileId === 'custom') {
      setNames(prev => ({ ...prev, [playerNum]: `Player ${playerNum}` }));
    } else {
      const found = profiles.find(p => p.id === profileId);
      if (found) {
        setNames(prev => ({ ...prev, [playerNum]: found.name }));
      }
    }
  };

  const toggleSound = () => {
    sfx.muted = !muted;
    setMuted(!muted);
  };

  const p1Name = names[1].trim() || 'Player 1';
  const p2Name = names[2].trim() || 'Player 2';
  const totalBoxes = gridSize * gridSize;
  const remainingBoxes = totalBoxes - (scores[1] + scores[2]);

  return (
    <div
      className={`flex flex-col items-center justify-between w-full h-full p-3 sm:p-5 select-none gap-3 overflow-hidden ${
        isFullViewport
          ? 'fixed inset-0 z-50 bg-slate-950'
          : ''
      }`}
    >
      {/* Top Bar / Controls */}
      <div className="w-full flex-none flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white font-black text-lg"
            style={{ background: `linear-gradient(135deg, ${theme.p1.main}, ${theme.p2.main})` }}
          >
            #
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-none m-0">
              DOTS & BOXES
            </h2>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              2-Player Family Pass & Play
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Grid Size Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            {[3, 5, 7].map(size => (
              <button
                key={size}
                onClick={() => initGame(size)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  gridSize === size
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setThemeIdx((themeIdx + 1) % THEMES.length)}
            title={`Theme: ${theme.name}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
          >
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: theme.p1.main }} />
            <span className="w-3 h-3 rounded-full inline-block -ml-1.5 ring-2 ring-slate-900" style={{ backgroundColor: theme.p2.main }} />
            <Palette size={14} className="hidden sm:inline" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title="Toggle Sound Effects"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            {muted ? <VolumeX size={16} className="text-slate-500" /> : <Volume2 size={16} />}
          </button>

          {/* Undo Button */}
          <button
            onClick={undoMove}
            disabled={historyCount === 0}
            title="Undo Last Move"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors border border-slate-700 flex items-center gap-1 text-xs font-bold"
          >
            <Undo2 size={15} />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={() => initGame(gridSize)}
            title="Start New Game"
            className="px-2.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-colors shadow-sm flex items-center gap-1 text-xs font-black"
          >
            <RotateCcw size={14} />
            <span>New</span>
          </button>

          {/* Full Viewport Toggle */}
          <button
            onClick={() => setIsFullViewport(prev => !prev)}
            title={isFullViewport ? 'Exit Full Screen Overlay' : 'Expand Over Entire Screen'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1 text-xs font-bold"
          >
            {isFullViewport ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Player Cards & Turn Status */}
      <div className="w-full flex-none grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-center">
        {/* Player 1 Card */}
        <div
          className={`col-span-1 sm:col-span-4 rounded-2xl p-3 border-2 transition-all flex items-center justify-between gap-2 bg-slate-900/70 ${
            !gameOver && currentPlayer === 1 ? 'scale-[1.02] shadow-lg' : 'border-slate-700/80 opacity-85'
          }`}
          style={{
            borderColor: !gameOver && currentPlayer === 1 ? theme.p1.main : undefined,
            boxShadow: !gameOver && currentPlayer === 1 ? `0 8px 20px -6px ${theme.p1.main}55` : undefined
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
              style={{ backgroundColor: theme.p1.main }}
            >
              {getInitials(p1Name, 'P1')}
            </div>
            <div className="min-w-0 flex-1">
              {profiles.length > 0 ? (
                <select
                  value={selectedProfiles[1]}
                  onChange={e => handleProfileChange(1, e.target.value)}
                  className="w-full font-bold text-xs sm:text-sm text-white bg-transparent border-b border-slate-700 focus:border-cyan-400 focus:outline-none truncate cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                  <option value="custom" className="bg-slate-900 text-slate-300">
                    Custom...
                  </option>
                </select>
              ) : null}
              {(profiles.length === 0 || selectedProfiles[1] === 'custom') && (
                <input
                  type="text"
                  value={names[1]}
                  maxLength={14}
                  onChange={e => setNames(prev => ({ ...prev, 1: e.target.value }))}
                  className="w-full font-bold text-xs sm:text-sm text-white bg-transparent border-b border-slate-700 focus:border-cyan-400 focus:outline-none truncate mt-0.5"
                  placeholder="Player 1"
                />
              )}
              <span
                className="text-[11px] font-bold block mt-0.5"
                style={{ color: !gameOver && currentPlayer === 1 ? theme.p1.main : '#64748b' }}
              >
                {gameOver ? 'Finished' : currentPlayer === 1 ? 'Your Turn' : 'Waiting'}
              </span>
            </div>
          </div>
          <div
            className={`text-2xl font-black px-1.5 transition-transform ${
              scoreBump === 1 ? 'scale-125' : 'scale-100'
            }`}
            style={{ color: theme.p1.main }}
          >
            {scores[1]}
          </div>
        </div>

        {/* Center Status Pill */}
        <div className="col-span-2 sm:col-span-4 order-first sm:order-none flex flex-col items-center justify-center text-center">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: gameOver
                  ? '#64748b'
                  : currentPlayer === 1
                  ? theme.p1.main
                  : theme.p2.main
              }}
            />
            <span className="text-xs sm:text-sm font-bold text-white">
              {gameOver ? 'Game Over!' : `${currentPlayer === 1 ? p1Name : p2Name}'s Turn`}
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            {remainingBoxes === 1 ? '1 box remaining' : `${remainingBoxes} boxes remaining`}
          </p>
        </div>

        {/* Player 2 Card */}
        <div
          className={`col-span-1 sm:col-span-4 rounded-2xl p-3 border-2 transition-all flex items-center justify-between gap-2 bg-slate-900/70 ${
            !gameOver && currentPlayer === 2 ? 'scale-[1.02] shadow-lg' : 'border-slate-700/80 opacity-85'
          }`}
          style={{
            borderColor: !gameOver && currentPlayer === 2 ? theme.p2.main : undefined,
            boxShadow: !gameOver && currentPlayer === 2 ? `0 8px 20px -6px ${theme.p2.main}55` : undefined
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
              style={{ backgroundColor: theme.p2.main }}
            >
              {getInitials(p2Name, 'P2')}
            </div>
            <div className="min-w-0 flex-1">
              {profiles.length > 0 ? (
                <select
                  value={selectedProfiles[2]}
                  onChange={e => handleProfileChange(2, e.target.value)}
                  className="w-full font-bold text-xs sm:text-sm text-white bg-transparent border-b border-slate-700 focus:border-cyan-400 focus:outline-none truncate cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                  <option value="custom" className="bg-slate-900 text-slate-300">
                    Custom...
                  </option>
                </select>
              ) : null}
              {(profiles.length === 0 || selectedProfiles[2] === 'custom') && (
                <input
                  type="text"
                  value={names[2]}
                  maxLength={14}
                  onChange={e => setNames(prev => ({ ...prev, 2: e.target.value }))}
                  className="w-full font-bold text-xs sm:text-sm text-white bg-transparent border-b border-slate-700 focus:border-cyan-400 focus:outline-none truncate mt-0.5"
                  placeholder="Player 2"
                />
              )}
              <span
                className="text-[11px] font-bold block mt-0.5"
                style={{ color: !gameOver && currentPlayer === 2 ? theme.p2.main : '#64748b' }}
              >
                {gameOver ? 'Finished' : currentPlayer === 2 ? 'Your Turn' : 'Waiting'}
              </span>
            </div>
          </div>
          <div
            className={`text-2xl font-black px-1.5 transition-transform ${
              scoreBump === 2 ? 'scale-125' : 'scale-100'
            }`}
            style={{ color: theme.p2.main }}
          >
            {scores[2]}
          </div>
        </div>
      </div>

      {/* Canvas Board Container */}
      <div
        ref={wrapperRef}
        className={`flex-1 min-h-0 w-full rounded-3xl shadow-lg border p-3 sm:p-5 flex items-center justify-center relative overflow-hidden ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-700/80 shadow-black/40'
            : 'bg-white border-slate-200 shadow-slate-200/70'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="rounded-2xl touch-none cursor-pointer"
        />

        {/* Floating Combo / Extra Turn Toast */}
        <div
          className={`pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md ${
            toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
          style={{
            backgroundColor: toast.player === 1 ? theme.p1.main : theme.p2.main
          }}
        >
          {toast.text}
        </div>
      </div>

      <p className="flex-none text-center text-[11px] text-slate-400 font-medium">
        Tap or click any dashed line between two dots to claim it. Complete the 4th side of a box to score & go again!
      </p>

      {/* Victory / Tie Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-700 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{ background: `linear-gradient(to right, ${theme.p1.main}, ${theme.p2.main})` }}
            />
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl">
              {scores[1] === scores[2] ? '🤝' : '🏆'}
            </div>
            <h3
              className="text-2xl font-black mb-1"
              style={{
                color:
                  scores[1] > scores[2]
                    ? theme.p1.main
                    : scores[2] > scores[1]
                    ? theme.p2.main
                    : '#f8fafc'
              }}
            >
              {scores[1] > scores[2]
                ? `${p1Name} Wins!`
                : scores[2] > scores[1]
                ? `${p2Name} Wins!`
                : "It's a Tie!"}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {scores[1] === scores[2]
                ? `Evenly matched at ${scores[1]} boxes each!`
                : `Won by ${Math.abs(scores[1] - scores[2])} ${
                    Math.abs(scores[1] - scores[2]) === 1 ? 'box' : 'boxes'
                  }!`}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-300 truncate max-w-full">{p1Name}</span>
                <span className="text-2xl font-black mt-0.5" style={{ color: theme.p1.main }}>
                  {scores[1]}
                </span>
              </div>
              <div className="flex flex-col items-center border-l border-slate-700">
                <span className="text-xs font-bold text-slate-300 truncate max-w-full">{p2Name}</span>
                <span className="text-2xl font-black mt-0.5" style={{ color: theme.p2.main }}>
                  {scores[2]}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                View Board
              </button>
              <button
                onClick={() => initGame(gridSize)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-md transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
