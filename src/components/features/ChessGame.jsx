import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChessGameEngine,
  squareToName,
  nameToSquare,
  squareToColRow,
  colRowToSquare,
  isWhite,
  isBlack
} from '../../lib/chessEngine';
import { StockfishService } from '../../lib/stockfishService';
import {
  CHESS_OPENINGS_DB,
  detectOpeningAndCoach,
  analyzePlayedMove
} from '../../lib/chessOpenings';
import { ChessPiece, PIECE_SKINS } from './ChessPieces';
import { pb } from '../../lib/pocketbase';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Undo2,
  Sparkles,
  Bot,
  Users,
  Trophy,
  Maximize2,
  Minimize2,
  Palette,
  Lightbulb,
  ArrowUpDown,
  Swords,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Check,
  User,
  X,
  BookOpen,
  GraduationCap,
  Shield
} from 'lucide-react';

const BOARD_THEMES = [
  {
    id: 'cyber',
    name: 'Cyber Slate',
    light: '#334155',
    dark: '#0f172a',
    border: 'border-cyan-500/40',
    highlight: 'rgba(6, 182, 212, 0.45)',
    lastMove: 'rgba(56, 189, 248, 0.25)',
    hint: 'rgba(234, 179, 8, 0.45)',
    pattern: 'radial-gradient(circle at center, rgba(34,211,238,0.06) 1px, transparent 1px)'
  },
  {
    id: 'forest',
    name: 'Tournament Green',
    light: '#eeeed2',
    dark: '#769656',
    border: 'border-emerald-600/40',
    highlight: 'rgba(247, 247, 105, 0.5)',
    lastMove: 'rgba(187, 203, 43, 0.45)',
    hint: 'rgba(56, 189, 248, 0.45)'
  },
  {
    id: 'walnut',
    name: 'Grandmaster Walnut',
    light: '#f0d9b5',
    dark: '#b58863',
    border: 'border-amber-700/50',
    highlight: 'rgba(100, 110, 64, 0.5)',
    lastMove: 'rgba(205, 210, 106, 0.45)',
    hint: 'rgba(14, 165, 233, 0.45)',
    pattern: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 6px)'
  },
  {
    id: 'marble',
    name: 'Carrara Marble',
    light: '#f1f5f9',
    dark: '#475569',
    border: 'border-slate-400/40',
    highlight: 'rgba(56, 189, 248, 0.4)',
    lastMove: 'rgba(148, 163, 184, 0.4)',
    hint: 'rgba(250, 204, 21, 0.45)',
    pattern: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)'
  },
  {
    id: 'neon',
    name: 'Neon Synthwave',
    light: '#581c87',
    dark: '#1e1b4b',
    border: 'border-fuchsia-500/50',
    highlight: 'rgba(217, 70, 239, 0.45)',
    lastMove: 'rgba(168, 85, 247, 0.3)',
    hint: 'rgba(34, 211, 238, 0.45)'
  },
  {
    id: 'arctic',
    name: 'Arctic Crystal',
    light: '#e0f2fe',
    dark: '#0284c7',
    border: 'border-sky-400/50',
    highlight: 'rgba(250, 204, 21, 0.5)',
    lastMove: 'rgba(56, 189, 248, 0.35)',
    hint: 'rgba(244, 63, 94, 0.45)'
  },
  {
    id: 'lava',
    name: 'Volcanic Obsidian',
    light: '#44403c',
    dark: '#1c1917',
    border: 'border-orange-500/50',
    highlight: 'rgba(249, 115, 22, 0.5)',
    lastMove: 'rgba(234, 88, 12, 0.32)',
    hint: 'rgba(250, 204, 21, 0.5)'
  },
  {
    id: 'custom',
    name: 'Custom Board',
    light: '#e2e8f0',
    dark: '#334155',
    border: 'border-cyan-400/40',
    highlight: 'rgba(56, 189, 248, 0.45)',
    lastMove: 'rgba(56, 189, 248, 0.25)',
    hint: 'rgba(234, 179, 8, 0.45)'
  }
];

const SKILL_LEVELS = [
  { level: 1, depth: 2, name: 'Level 1: Beginner', elo: '~800', desc: 'Friendly for kids, makes occasional blunders' },
  { level: 4, depth: 4, name: 'Level 2: Casual', elo: '~1200', desc: 'Plays solid fundamentals' },
  { level: 9, depth: 8, name: 'Level 3: Intermediate', elo: '~1500', desc: 'Tactical and alert' },
  { level: 15, depth: 12, name: 'Level 4: Club Master', elo: '~2000', desc: 'Deep positional foresight' },
  { level: 20, depth: 16, name: 'Level 5: Grandmaster', elo: '~3000+', desc: 'Full Stockfish power' }
];

// Web Audio synthesizer for chess SFX
class ChessAudio {
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

  playMove() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playCapture() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playCheck() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  playCastle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [260, 340].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);
    });
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }
}

const chessAudio = new ChessAudio();

function getInitials(name, fallback) {
  const clean = (name || '').trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function ChessGame({ profiles = [], isDarkMode = true }) {
  // Engine instance
  const [engine] = useState(() => new ChessGameEngine());
  const stockfishRef = useRef(null);

  // Game configuration
  const [gameMode, setGameMode] = useState('stockfish'); // 'stockfish' | 'pvp'
  const [playerColor, setPlayerColor] = useState('w'); // 'w' | 'b' (human in vs-stockfish)
  const [skillIdx, setSkillIdx] = useState(1); // default Casual
  const [themeIdx, setThemeIdx] = useState(() => {
    const saved = localStorage.getItem('chessBoardThemeIdx');
    const idx = saved !== null ? Number(saved) : 0;
    return idx >= 0 && idx < BOARD_THEMES.length ? idx : 0;
  });
  const [pieceSkin, setPieceSkin] = useState(() => {
    return localStorage.getItem('chessPieceSkin') || 'classic';
  });
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('chessCustomColors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      lightSquare: '#e2e8f0',
      darkSquare: '#334155',
      whitePiece: '#38bdf8',
      blackPiece: '#fb7185'
    };
  });
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoFlipTurn, setAutoFlipTurn] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [isFullViewport, setIsFullViewport] = useState(false);
  const [muted, setMuted] = useState(false);

  // Persist skin selections
  useEffect(() => {
    localStorage.setItem('chessBoardThemeIdx', String(themeIdx));
  }, [themeIdx]);

  useEffect(() => {
    localStorage.setItem('chessPieceSkin', pieceSkin);
  }, [pieceSkin]);

  useEffect(() => {
    localStorage.setItem('chessCustomColors', JSON.stringify(customColors));
  }, [customColors]);

  // Player selection (Pass & Play & vs Stockfish)
  const [selectedProfiles, setSelectedProfiles] = useState({ 1: '', 2: '' });
  const [playerNames, setPlayerNames] = useState({ 1: 'Player 1', 2: 'Player 2' });

  // Board interaction state
  const [board, setBoard] = useState(() => [...engine.board]);
  const [turn, setTurn] = useState(() => engine.turn);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }
  const [stockfishHint, setStockfishHint] = useState(null); // { from, to, san }

  // Stockfish evaluation & status
  const [engineReady, setEngineReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [evalScore, setEvalScore] = useState({ cp: 0, mate: null });
  const [gameStatus, setGameStatus] = useState(() => engine.getGameStatus());
  const [history, setHistory] = useState([]);
  const [captured, setCaptured] = useState(() => engine.getCapturedPieces());

  // Win / Reward state
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const historyEndRef = useRef(null);
  const boardContainerRef = useRef(null);
  const [boardSize, setBoardSize] = useState(560);

  // Dynamically size board to fill available viewport space
  useEffect(() => {
    const updateSize = () => {
      const el = boardContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Account for evaluation bar width (~32px) and top opening banner height (~46px)
      const availW = rect.width - (showEvalBar ? 36 : 8);
      const availH = rect.height - 52;
      const nextSize = Math.max(260, Math.floor(Math.min(availW, availH)));
      setBoardSize(nextSize);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    let observer;
    if (typeof ResizeObserver !== 'undefined' && boardContainerRef.current) {
      observer = new ResizeObserver(updateSize);
      observer.observe(boardContainerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, [showEvalBar, isFullViewport]);

  // Opening & Defense Coach / Academy state
  const [activeLesson, setActiveLesson] = useState(null); // entry from CHESS_OPENINGS_DB
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [learnTab, setLearnTab] = useState('opening'); // 'opening' | 'defense'
  const [moveQualities, setMoveQualities] = useState({}); // { [plyIdx]: { badge, color, tip } }
  const [latestMoveFeedback, setLatestMoveFeedback] = useState(null);
  const [hoveredBookMove, setHoveredBookMove] = useState(null); // { from, to, san, note }
  const lastEvalCpRef = useRef(0);

  // Initialize profiles
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfiles[1] && !selectedProfiles[2]) {
      const p1 = profiles[0];
      const p2 = profiles[1] || null;
      setSelectedProfiles({
        1: p1 ? p1.id : 'custom1',
        2: p2 ? p2.id : 'custom2'
      });
      setPlayerNames({
        1: p1 ? p1.name : 'Player 1',
        2: p2 ? p2.name : 'Player 2'
      });
    }
  }, [profiles, selectedProfiles]);

  const handleProfileChange = (playerSlot, profileId) => {
    if (profileId === 'custom') {
      const defaultName = playerSlot === 1 ? 'Player 1' : 'Player 2';
      setSelectedProfiles(prev => ({ ...prev, [playerSlot]: 'custom' }));
      setPlayerNames(prev => ({ ...prev, [playerSlot]: defaultName }));
    } else {
      const selected = profiles.find(p => p.id === profileId);
      if (selected) {
        setSelectedProfiles(prev => ({ ...prev, [playerSlot]: selected.id }));
        setPlayerNames(prev => ({ ...prev, [playerSlot]: selected.name }));
      }
    }
  };

  // Keep audio muted state in sync
  useEffect(() => {
    chessAudio.muted = muted;
  }, [muted]);

  // Sync orientation when playerColor changes in vs-Stockfish
  useEffect(() => {
    if (gameMode === 'stockfish') {
      setIsFlipped(playerColor === 'b');
    }
  }, [playerColor, gameMode]);

  // Initialize Stockfish Engine
  useEffect(() => {
    const sf = new StockfishService();
    stockfishRef.current = sf;

    sf.onReady = () => {
      setEngineReady(true);
      sf.setSkillLevel(SKILL_LEVELS[skillIdx].level);
      sf.evaluatePosition(engine.getFen(), 10);
    };

    sf.onEvaluation = ({ cp, mate }) => {
      const numericCp = cp !== null ? cp : (mate !== null ? (mate > 0 ? 2000 : -2000) : 0);
      setEvalScore({ cp: cp !== null ? cp : 0, mate });
      // Update quality of the most recent move once Stockfish evaluates the new position
      const histLen = engine.history.length;
      if (histLen > 0) {
        const lastRecord = engine.history[histLen - 1];
        const plyIdx = histLen - 1;
        const playedSans = engine.history.map(h => (h.san || '').replace(/[+#?!]/g, '').trim());
        const isBook = CHESS_OPENINGS_DB.some(entry =>
          entry.moves.length >= histLen &&
          entry.moves.slice(0, histLen).every((m, idx) => m.replace(/[+#?!]/g, '').trim() === playedSans[idx])
        );
        const analysis = analyzePlayedMove(lastRecord, isBook, lastEvalCpRef.current, numericCp);
        setMoveQualities(prev => ({ ...prev, [plyIdx]: analysis }));
        setLatestMoveFeedback({ san: lastRecord.san, ...analysis });
      }
      lastEvalCpRef.current = numericCp;
    };

    sf.onFallbackCalculate = () => {
      const best = engine.getFallbackBestMove(SKILL_LEVELS[skillIdx].depth);
      return best ? engine.moveToUci(best) : null;
    };

    sf.init();

    return () => {
      sf.terminate();
    };
  }, []);

  // Sync skill level changes with Stockfish
  useEffect(() => {
    if (stockfishRef.current && engineReady) {
      stockfishRef.current.setSkillLevel(SKILL_LEVELS[skillIdx].level);
    }
  }, [skillIdx, engineReady]);

  // Auto-scroll move history
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Helper to sync state from engine
  const syncGameState = useCallback(() => {
    setBoard([...engine.board]);
    setTurn(engine.turn);
    const status = engine.getGameStatus();
    setGameStatus(status);
    setCaptured(engine.getCapturedPieces());

    if (status.over) {
      engine.history = [];
      setHistory([]);
      setMoveQualities({});
      setLatestMoveFeedback(null);
      setShowGameOverModal(true);
      if (status.winner) {
        chessAudio.playVictory();
        awardWinXP(status.winner);
      }
    } else {
      const curHistory = [...engine.history];
      setHistory(curHistory);
      if (curHistory.length > 0) {
        const plyIdx = curHistory.length - 1;
        const lastRecord = curHistory[plyIdx];
        const playedSans = curHistory.map(h => (h.san || '').replace(/[+#?!]/g, '').trim());
        const isBook = CHESS_OPENINGS_DB.some(entry =>
          entry.moves.length >= curHistory.length &&
          entry.moves.slice(0, curHistory.length).every((m, idx) => m.replace(/[+#?!]/g, '').trim() === playedSans[idx])
        );
        const initialAnalysis = analyzePlayedMove(lastRecord, isBook, null, null);
        setMoveQualities(prev => (prev[plyIdx] ? prev : { ...prev, [plyIdx]: initialAnalysis }));
        setLatestMoveFeedback({ san: lastRecord.san, ...initialAnalysis });
      }
      if (status.check) {
        chessAudio.playCheck();
      }
    }

    // Request non-intrusive evaluation for eval bar
    if (stockfishRef.current && !status.over) {
      stockfishRef.current.evaluatePosition(engine.getFen(), 10);
    }
  }, [engine]);

  // Award XP for winning games
  const awardWinXP = async (winnerName) => {
    if (xpAwarded) return;
    try {
      let winningProfileId = null;
      if (gameMode === 'stockfish') {
        const isHumanWinner = (winnerName === 'White' && playerColor === 'w') ||
                              (winnerName === 'Black' && playerColor === 'b');
        if (isHumanWinner && selectedProfiles[1] && !selectedProfiles[1].startsWith('custom')) {
          winningProfileId = selectedProfiles[1];
        }
      } else {
        const profileId = winnerName === 'White' ? selectedProfiles[1] : selectedProfiles[2];
        if (profileId && !profileId.startsWith('custom')) {
          winningProfileId = profileId;
        }
      }

      if (winningProfileId) {
        const profile = profiles.find(p => p.id === winningProfileId);
        if (profile) {
          const newXP = (profile.xp_balance || 0) + 25;
          await pb.collection('profiles').update(winningProfileId, {
            xp_balance: newXP
          });
          setXpAwarded(true);
        }
      }
    } catch (err) {
      console.warn('Could not update profile XP:', err);
    }
  };

  // Trigger Stockfish move (or guided Book Move when practicing an Opening/Defense lesson!)
  const triggerStockfishMove = useCallback(() => {
    if (engine.isGameOver()) return;
    setIsThinking(true);
    setStockfishHint(null);

    // If an Opening/Defense Lesson is active, check if we are still on the book line
    if (activeLesson && engine.history.length < activeLesson.moves.length) {
      const ply = engine.history.length;
      const playedSans = engine.history.map(h => (h.san || '').replace(/[+#?!]/g, '').trim());
      const onBookSoFar = playedSans.every(
        (s, idx) => s === activeLesson.moves[idx].replace(/[+#?!]/g, '').trim()
      );
      if (onBookSoFar) {
        const targetSan = activeLesson.moves[ply].replace(/[+#?!]/g, '').trim();
        const legal = engine.getLegalMoves();
        const bookMoveObj = legal.find(
          m => engine.moveToSan(m, legal).replace(/[+#?!]/g, '').trim() === targetSan
        );
        if (bookMoveObj) {
          setTimeout(() => {
            setIsThinking(false);
            const record = engine.playMove(bookMoveObj);
            if (record) {
              if (record.captured || record.isEnPassant) {
                chessAudio.playCapture();
              } else if (record.isCastle) {
                chessAudio.playCastle();
              } else {
                chessAudio.playMove();
              }
              setLastMove({ from: record.from, to: record.to });
              syncGameState();
            }
          }, 350);
          return;
        }
      }
    }

    const sf = stockfishRef.current;
    if (!sf) return;

    sf.onBestMove = (bestMoveUci) => {
      setIsThinking(false);
      if (!bestMoveUci) return;

      const record = engine.playMove(bestMoveUci);
      if (record) {
        if (record.captured || record.isEnPassant) {
          chessAudio.playCapture();
        } else if (record.isCastle) {
          chessAudio.playCastle();
        } else {
          chessAudio.playMove();
        }
        setLastMove({ from: record.from, to: record.to });
        syncGameState();
      }
    };

    const currentConfig = SKILL_LEVELS[skillIdx];
    sf.findBestMove(engine.getFen(), {
      depth: currentConfig.depth,
      movetime: Math.min(1800, currentConfig.depth * 150),
      skillLevel: currentConfig.level
    });
  }, [engine, skillIdx, syncGameState, activeLesson]);

  // Check if Stockfish should move (ONLY in vs-stockfish mode and ONLY on computer's turn!)
  useEffect(() => {
    if (gameMode === 'stockfish' && !gameStatus.over) {
      const isComputerTurn = (turn === 'w' && playerColor === 'b') ||
                             (turn === 'b' && playerColor === 'w');
      if (isComputerTurn && !isThinking) {
        const timer = setTimeout(() => {
          triggerStockfishMove();
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [turn, gameMode, playerColor, gameStatus.over, isThinking, triggerStockfishMove]);

  // Auto flip in 2-player mode
  useEffect(() => {
    if (gameMode === 'pvp' && autoFlipTurn) {
      setIsFlipped(turn === 'b');
    }
  }, [turn, gameMode, autoFlipTurn]);

  // Handle square click
  const handleSquareClick = (squareIdx) => {
    if (gameStatus.over || isThinking) return;

    // In vs Stockfish, prevent clicking if not player's turn
    if (gameMode === 'stockfish') {
      const isPlayerTurn = (turn === 'w' && playerColor === 'w') ||
                           (turn === 'b' && playerColor === 'b');
      if (!isPlayerTurn) return;
    }

    const pieceOnSquare = engine.getPiece(squareIdx);

    // If square is already selected, unselect or click same
    if (selectedSquare === squareIdx) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // If a piece is already selected, check if clicked square is a valid target
    if (selectedSquare !== null) {
      const matchedMove = legalMoves.find(m => m.to === squareIdx);
      if (matchedMove) {
        // Check for pawn promotion
        const movingPiece = engine.getPiece(selectedSquare);
        const { row: toRow } = squareToColRow(squareIdx);
        const isPromotion = movingPiece && movingPiece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7);

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: squareIdx });
          return;
        }

        executeMove(matchedMove);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // Select piece if it belongs to current player's turn
    if (pieceOnSquare) {
      const isPieceCurrentTurn = (turn === 'w' && isWhite(pieceOnSquare)) ||
                                 (turn === 'b' && isBlack(pieceOnSquare));
      if (isPieceCurrentTurn) {
        setSelectedSquare(squareIdx);
        setLegalMoves(engine.getLegalMovesForSquare(squareIdx));
        return;
      }
    }

    // Otherwise clear selection
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Execute a valid move
  const executeMove = (move) => {
    const record = engine.playMove(move);
    if (!record) return;

    if (record.captured || record.isEnPassant) {
      chessAudio.playCapture();
    } else if (record.isCastle) {
      chessAudio.playCastle();
    } else {
      chessAudio.playMove();
    }

    setLastMove({ from: record.from, to: record.to });
    setStockfishHint(null);
    syncGameState();
  };

  // Complete promotion
  const handlePromotionSelect = (promoType) => {
    if (!pendingPromotion) return;
    const move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: promoType
    };
    executeMove(move);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Request Stockfish Hint without playing it
  const handleAskStockfish = () => {
    if (gameStatus.over || isThinking) return;
    const sf = stockfishRef.current;
    if (!sf) return;

    sf.onHint = (bestMoveUci) => {
      if (bestMoveUci && bestMoveUci.length >= 4) {
        const from = nameToSquare(bestMoveUci.slice(0, 2));
        const to = nameToSquare(bestMoveUci.slice(2, 4));
        const moveObj = engine.getLegalMoves().find(m => m.from === from && m.to === to);
        const san = moveObj ? engine.moveToSan(moveObj) : bestMoveUci;
        setStockfishHint({ from, to, san, uci: bestMoveUci });
      }
    };

    sf.findHint(engine.getFen(), { depth: 12, movetime: 1200 });
  };

  // Undo move
  const handleUndo = () => {
    if (isThinking || history.length === 0) return;
    if (stockfishRef.current) {
      stockfishRef.current.stop();
    }

    if (gameMode === 'stockfish') {
      // Undo both computer's move and player's move
      engine.undo();
      if (engine.turn !== playerColor && history.length > 1) {
        engine.undo();
      }
    } else {
      engine.undo();
    }

    setSelectedSquare(null);
    setLegalMoves([]);
    setStockfishHint(null);
    setShowGameOverModal(false);
    setXpAwarded(false);
    setIsThinking(false);

    const last = engine.history[engine.history.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
    syncGameState();
  };

  // New Game
  const handleNewGame = (keepLesson = false) => {
    if (stockfishRef.current) {
      stockfishRef.current.stop();
      stockfishRef.current.startNewGame();
    }
    engine.load();
    setHistory([]);
    setMoveQualities({});
    setLatestMoveFeedback(null);
    setHoveredBookMove(null);
    lastEvalCpRef.current = 0;
    if (!keepLesson) {
      setActiveLesson(null);
    }
    setEvalScore({ cp: 0, mate: null });
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setStockfishHint(null);
    setShowGameOverModal(false);
    setXpAwarded(false);
    setIsThinking(false);
    syncGameState();
  };

  // Start a guided Opening or Defense lesson
  const handleStartLesson = (lessonEntry) => {
    setGameMode('stockfish');
    setPlayerColor(lessonEntry.side || 'w');
    setActiveLesson(lessonEntry);
    setShowLearnModal(false);
    if (stockfishRef.current) {
      stockfishRef.current.stop();
      stockfishRef.current.startNewGame();
    }
    engine.load();
    setHistory([]);
    setMoveQualities({});
    setLatestMoveFeedback(null);
    setHoveredBookMove(null);
    lastEvalCpRef.current = 0;
    setEvalScore({ cp: 0, mate: null });
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setStockfishHint(null);
    setShowGameOverModal(false);
    setXpAwarded(false);
    setIsThinking(false);
    syncGameState();
  };

  const baseTheme = BOARD_THEMES[themeIdx] || BOARD_THEMES[0];
  const theme = baseTheme.id === 'custom'
    ? { ...baseTheme, light: customColors.lightSquare, dark: customColors.darkSquare }
    : baseTheme;
  const kingInCheckSq = gameStatus.check ? engine.getKingSquare(turn) : -1;

  // Material evaluation percentage for the eval bar
  const evalPercentage = useMemo(() => {
    if (evalScore.mate !== null) {
      return evalScore.mate > 0 ? 100 : 0;
    }
    const cp = Math.max(-1000, Math.min(1000, evalScore.cp));
    return 50 + (cp / 1000) * 45;
  }, [evalScore]);

  // Display text for eval score
  const evalDisplay = useMemo(() => {
    if (evalScore.mate !== null) {
      return `M${Math.abs(evalScore.mate)}`;
    }
    const val = (evalScore.cp / 100).toFixed(1);
    return evalScore.cp > 0 ? `+${val}` : val;
  }, [evalScore]);

  // Map 0..63 indices according to board orientation
  const squareIndices = useMemo(() => {
    const list = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const row = isFlipped ? 7 - r : r;
        const col = isFlipped ? 7 - c : c;
        list.push(colRowToSquare(col, row));
      }
    }
    return list;
  }, [isFlipped]);

  const p1Name = playerNames[1] || 'Player 1';
  const p2Name = playerNames[2] || 'Player 2';
  const p1Profile = profiles.find(p => p.id === selectedProfiles[1]);
  const p2Profile = profiles.find(p => p.id === selectedProfiles[2]);

  // Real-time Opening & Defense detection and next book moves
  const openingCoach = useMemo(() => {
    return detectOpeningAndCoach(history, engine);
  }, [history, engine, board]);

  // Active guided lesson target (when practicing a chosen Opening or Defense)
  const guidedLessonStep = useMemo(() => {
    if (!activeLesson || gameStatus.over) return null;
    const ply = history.length;
    const playedSans = history.map(h => (h.san || '').replace(/[+#?!]/g, '').trim());
    const onBookSoFar = playedSans.every(
      (s, idx) => idx < activeLesson.moves.length && s === activeLesson.moves[idx].replace(/[+#?!]/g, '').trim()
    );

    if (!onBookSoFar) {
      return {
        status: 'off_book',
        message: 'You deviated from the lesson line! Click Undo to return to the guided move, or keep playing freely.'
      };
    }

    if (ply >= activeLesson.moves.length) {
      return {
        status: 'completed',
        message: `🎉 ${activeLesson.name} book line completed! Now play out the game against Stockfish!`
      };
    }

    const expectedSan = activeLesson.moves[ply];
    const cleanSan = expectedSan.replace(/[+#?!]/g, '').trim();
    const legal = engine.getLegalMoves();
    const moveObj = legal.find(m => engine.moveToSan(m, legal).replace(/[+#?!]/g, '').trim() === cleanSan);

    return {
      status: 'active',
      stepNum: ply + 1,
      totalSteps: activeLesson.moves.length,
      san: expectedSan,
      note: activeLesson.moveNotes?.[ply] || activeLesson.summary,
      from: moveObj ? moveObj.from : -1,
      to: moveObj ? moveObj.to : -1
    };
  }, [activeLesson, history, engine, board, gameStatus.over]);

  return (
    <div
      className={`relative w-full h-full flex flex-col min-h-0 bg-slate-950 text-slate-100 select-none overflow-hidden ${
        isFullViewport ? 'fixed inset-0 z-50 p-2 md:p-6 bg-slate-950/98 backdrop-blur-md' : ''
      }`}
    >
      {/* TOP CONTROL BAR */}
      <div className="flex-none px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Mode & Difficulty */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => { setGameMode('stockfish'); handleNewGame(); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
                gameMode === 'stockfish' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Bot size={13} />
              <span>vs Stockfish</span>
            </button>
            <button
              onClick={() => { setGameMode('pvp'); handleNewGame(); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all ${
                gameMode === 'pvp' ? 'bg-emerald-400 text-black shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users size={13} />
              <span>Pass & Play</span>
            </button>
          </div>

          {/* Difficulty Dropdown (if vs Stockfish) */}
          {gameMode === 'stockfish' && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Skill:</span>
              <select
                value={skillIdx}
                onChange={(e) => setSkillIdx(Number(e.target.value))}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {SKILL_LEVELS.map((lvl, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900 text-slate-100">
                    {lvl.name} ({lvl.elo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Player Side Pick (if vs Stockfish) */}
          {gameMode === 'stockfish' && (
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/60">
              <button
                onClick={() => { setPlayerColor('w'); handleNewGame(); }}
                className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  playerColor === 'w' ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="You play as White"
              >
                White
              </button>
              <button
                onClick={() => { setPlayerColor('b'); handleNewGame(); }}
                className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  playerColor === 'b' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="You play as Black"
              >
                Black
              </button>
            </div>
          )}

          {/* Auto flip toggle in Pass & Play */}
          {gameMode === 'pvp' && (
            <button
              onClick={() => setAutoFlipTurn(f => !f)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition ${
                autoFlipTurn
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Automatically flip board on each turn (great for tablet placed flat on table)"
            >
              <ArrowUpDown size={12} />
              <span>Auto-Flip</span>
            </button>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5">
          {/* Learn Openings & Defenses Academy */}
          <button
            onClick={() => setShowLearnModal(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-xs transition ${
              activeLesson
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
            title="Learn Chess Openings & Defenses with Guided Interactive Lessons"
          >
            <GraduationCap size={14} />
            <span>{activeLesson ? 'Lesson Active' : 'Learn'}</span>
          </button>

          {/* Ask Stockfish Hint */}
          <button
            onClick={handleAskStockfish}
            disabled={gameStatus.over || isThinking}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition disabled:opacity-40"
            title="Ask Stockfish for the best move in this position"
          >
            <Lightbulb size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Hint</span>
          </button>

          {/* Undo Move */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isThinking}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold text-xs transition disabled:opacity-40"
            title="Undo move"
          >
            <Undo2 size={13} />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Flip Board */}
          <button
            onClick={() => setIsFlipped(f => !f)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            title="Flip Board Orientation"
          >
            <ArrowUpDown size={14} />
          </button>

          {/* Skins & Board Customizer */}
          <button
            onClick={() => setShowSkinModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40 font-bold text-xs transition"
            title="Customize Board & Piece Skins"
          >
            <Palette size={13} className="text-fuchsia-400" />
            <span className="hidden sm:inline">Skins</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Restart */}
          <button
            onClick={handleNewGame}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition"
            title="Start New Game"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Fullscreen Overlay */}
          <button
            onClick={() => setIsFullViewport(!isFullViewport)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition"
            title={isFullViewport ? 'Exit Full Screen' : 'Expand Full Screen'}
          >
            {isFullViewport ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* MAIN GAME VIEW: 3-Column Split or Stacked on Mobile */}
      <div className="flex-1 min-h-0 w-full p-1.5 md:p-3 flex flex-col lg:flex-row items-stretch justify-between gap-3 overflow-hidden">
        {/* LEFT / SIDEBAR: Player Cards & Profiles */}
        <div className="w-full lg:w-64 flex-none flex flex-row lg:flex-col justify-between gap-2.5 bg-slate-900/70 border border-slate-800 p-2.5 rounded-2xl overflow-y-auto custom-scrollbar">
          {/* Top Player Card (Opponent or Black) */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            turn === (isFlipped ? 'w' : 'b')
              ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-cyan-400 shrink-0">
                  {gameMode === 'stockfish'
                    ? (playerColor === 'w' ? <Bot size={20} className="text-cyan-400" /> : getInitials(p1Name, 'P1'))
                    : (isFlipped ? getInitials(p1Name, 'P1') : getInitials(p2Name, 'P2'))}
                </div>
                <div className="min-w-0 flex-1">
                  {gameMode === 'stockfish' ? (
                    playerColor === 'w' ? (
                      <div>
                        <div className="font-black text-xs text-white">Stockfish Engine</div>
                        <div className="text-[10px] text-cyan-400 font-bold">{SKILL_LEVELS[skillIdx].desc}</div>
                      </div>
                    ) : (
                      profiles.length > 0 ? (
                        <select
                          value={selectedProfiles[1]}
                          onChange={(e) => handleProfileChange(1, e.target.value)}
                          className="bg-transparent font-bold text-xs text-white focus:outline-none cursor-pointer w-full truncate"
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                              {p.name} ({p.xp_balance || 0} XP)
                            </option>
                          ))}
                          <option value="custom" className="bg-slate-900 text-white">Guest Player</option>
                        </select>
                      ) : (
                        <div className="font-bold text-xs text-white truncate">{p1Name}</div>
                      )
                    )
                  ) : (
                    // Pass & Play Mode: Profile Picker for Top Player
                    profiles.length > 0 ? (
                      <select
                        value={isFlipped ? selectedProfiles[1] : selectedProfiles[2]}
                        onChange={(e) => handleProfileChange(isFlipped ? 1 : 2, e.target.value)}
                        className="bg-transparent font-bold text-xs text-white focus:outline-none cursor-pointer w-full truncate"
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                            {p.name} ({p.xp_balance || 0} XP)
                          </option>
                        ))}
                        <option value="custom" className="bg-slate-900 text-white">Guest Player</option>
                      </select>
                    ) : (
                      <div className="font-bold text-xs text-white truncate">{isFlipped ? p1Name : p2Name}</div>
                    )
                  )}
                  <div className="text-[10px] text-slate-400 font-medium">
                    {isFlipped ? 'White Pieces' : 'Black Pieces'}
                  </div>
                </div>
              </div>
              {turn === (isFlipped ? 'w' : 'b') && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-pulse shrink-0">
                  Turn
                </span>
              )}
            </div>

            {/* Captured tray for top player */}
            <div className="mt-2 flex items-center gap-0.5 text-[11px] text-slate-400 min-h-[22px] overflow-x-auto">
              {isFlipped ? (
                <>
                  {captured.whiteCaptured.map((p, i) => (
                    <span key={i} className="w-4 h-4 inline-flex shrink-0">
                      <ChessPiece piece={p} skin={pieceSkin} customColors={customColors} />
                    </span>
                  ))}
                  {captured.diff > 0 && <span className="ml-1 font-bold text-emerald-400">+{captured.diff}</span>}
                </>
              ) : (
                <>
                  {captured.blackCaptured.map((p, i) => (
                    <span key={i} className="w-4 h-4 inline-flex shrink-0">
                      <ChessPiece piece={p} skin={pieceSkin} customColors={customColors} />
                    </span>
                  ))}
                  {captured.diff < 0 && <span className="ml-1 font-bold text-emerald-400">+{Math.abs(captured.diff)}</span>}
                </>
              )}
            </div>
          </div>

          {/* Opening & Defense Coach + Engine Status Card */}
          <div className="hidden lg:flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950/75 border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                <BookOpen size={12} />
                <span>Opening & Defense Coach</span>
              </span>
              {gameMode === 'stockfish' ? (
                isThinking ? (
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Thinking...
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                    <Check size={11} /> Ready
                  </span>
                )
              ) : (
                <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <Users size={11} /> 2P
                </span>
              )}
            </div>

            {/* Active Opening / Defense Identification */}
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
              {openingCoach.opening ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-black text-[10px]">
                      {openingCoach.opening.eco}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      openingCoach.opening.category === 'defense'
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {openingCoach.opening.category === 'defense' ? '🛡️ Defense' : '⚔️ Opening'}
                    </span>
                  </div>
                  <div className="font-black text-white text-xs leading-snug mt-0.5">
                    {openingCoach.opening.name}
                  </div>
                </div>
              ) : (
                <div className="font-bold text-slate-300 text-xs">
                  Starting Position
                </div>
              )}
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                {openingCoach.coachNote}
              </p>
            </div>

            {/* Latest Move Quality Feedback */}
            {latestMoveFeedback && (
              <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/90 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">
                    Last Move: <strong className="text-white font-mono">{latestMoveFeedback.san}</strong>
                  </span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${latestMoveFeedback.color}`}>
                    {latestMoveFeedback.badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 leading-snug">
                  {latestMoveFeedback.tip}
                </div>
              </div>
            )}

            {/* Next Book Continuations */}
            {openingCoach.nextBookMoves?.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Book Continuations (Hover to preview):
                </span>
                <div className="flex flex-wrap gap-1">
                  {openingCoach.nextBookMoves.slice(0, 4).map((bm, idx) => (
                    <button
                      key={idx}
                      onMouseEnter={() => bm.coords && setHoveredBookMove({ ...bm.coords, san: bm.san, note: bm.note })}
                      onMouseLeave={() => setHoveredBookMove(null)}
                      onClick={() => bm.coords && setHoveredBookMove(prev => (prev?.san === bm.san ? null : { ...bm.coords, san: bm.san, note: bm.note }))}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[11px] transition flex items-center gap-1"
                      title={`${bm.openingName}: ${bm.note}`}
                    >
                      <span>📖 {bm.san}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stockfishHint && (
              <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <Lightbulb size={14} className="flex-none text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Stockfish Suggestion:</div>
                  <div className="font-extrabold text-white text-sm">{stockfishHint.san}</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Player Card (You or White) */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            turn === (isFlipped ? 'b' : 'w')
              ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-cyan-400 shrink-0">
                  {gameMode === 'stockfish'
                    ? (playerColor === 'w' ? getInitials(p1Name, 'P1') : <Bot size={20} className="text-cyan-400" />)
                    : (isFlipped ? getInitials(p2Name, 'P2') : getInitials(p1Name, 'P1'))}
                </div>
                <div className="min-w-0 flex-1">
                  {gameMode === 'stockfish' ? (
                    playerColor === 'w' ? (
                      profiles.length > 0 ? (
                        <select
                          value={selectedProfiles[1]}
                          onChange={(e) => handleProfileChange(1, e.target.value)}
                          className="bg-transparent font-bold text-xs text-white focus:outline-none cursor-pointer w-full truncate"
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                              {p.name} ({p.xp_balance || 0} XP)
                            </option>
                          ))}
                          <option value="custom" className="bg-slate-900 text-white">Guest Player</option>
                        </select>
                      ) : (
                        <div className="font-bold text-xs text-white truncate">{p1Name}</div>
                      )
                    ) : (
                      <div>
                        <div className="font-black text-xs text-white">Stockfish Engine</div>
                        <div className="text-[10px] text-cyan-400 font-bold">{SKILL_LEVELS[skillIdx].desc}</div>
                      </div>
                    )
                  ) : (
                    // Pass & Play Mode: Profile Picker for Bottom Player
                    profiles.length > 0 ? (
                      <select
                        value={isFlipped ? selectedProfiles[2] : selectedProfiles[1]}
                        onChange={(e) => handleProfileChange(isFlipped ? 2 : 1, e.target.value)}
                        className="bg-transparent font-bold text-xs text-white focus:outline-none cursor-pointer w-full truncate"
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                            {p.name} ({p.xp_balance || 0} XP)
                          </option>
                        ))}
                        <option value="custom" className="bg-slate-900 text-white">Guest Player</option>
                      </select>
                    ) : (
                      <div className="font-bold text-xs text-white truncate">{isFlipped ? p2Name : p1Name}</div>
                    )
                  )}
                  <div className="text-[10px] text-slate-400 font-medium">
                    {isFlipped ? 'Black Pieces' : 'White Pieces'}
                  </div>
                </div>
              </div>
              {turn === (isFlipped ? 'b' : 'w') && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-pulse shrink-0">
                  Turn
                </span>
              )}
            </div>

            {/* Captured tray for bottom player */}
            <div className="mt-2 flex items-center gap-0.5 text-[11px] text-slate-400 min-h-[22px] overflow-x-auto">
              {!isFlipped ? (
                <>
                  {captured.whiteCaptured.map((p, i) => (
                    <span key={i} className="w-4 h-4 inline-flex shrink-0">
                      <ChessPiece piece={p} skin={pieceSkin} customColors={customColors} />
                    </span>
                  ))}
                  {captured.diff > 0 && <span className="ml-1 font-bold text-emerald-400">+{captured.diff}</span>}
                </>
              ) : (
                <>
                  {captured.blackCaptured.map((p, i) => (
                    <span key={i} className="w-4 h-4 inline-flex shrink-0">
                      <ChessPiece piece={p} skin={pieceSkin} customColors={customColors} />
                    </span>
                  ))}
                  {captured.diff < 0 && <span className="ml-1 font-bold text-emerald-400">+{Math.abs(captured.diff)}</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: CHESS BOARD & EVALUATION BAR (Fills Remaining Space) */}
        <div
          ref={boardContainerRef}
          className="flex-1 min-h-0 min-w-0 w-full h-full flex items-center justify-center gap-2 overflow-hidden"
        >
          {/* Vertical Engine Evaluation Bar */}
          {showEvalBar && (
            <div
              style={{ height: `${boardSize}px` }}
              className="hidden sm:flex flex-col items-center w-6 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative shadow-inner self-end"
            >
              {/* White evaluation fill */}
              <div
                className="w-full bg-slate-200 transition-all duration-500"
                style={{
                  height: `${isFlipped ? 100 - evalPercentage : evalPercentage}%`
                }}
              />
              {/* Score text overlay */}
              <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center text-[10px] font-black text-slate-900 select-none">
                {evalDisplay}
              </div>
            </div>
          )}

          {/* CHESS BOARD GRID CONTAINER */}
          <div className="relative flex flex-col items-center gap-1.5">
            {/* Compact Live Opening / Guided Lesson Banner Above Board */}
            <div
              style={{ width: `${boardSize}px` }}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
            >
              {activeLesson && guidedLessonStep ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-[10px] uppercase shrink-0">
                        🎓 {activeLesson.name}
                      </span>
                      {guidedLessonStep.status === 'active' && (
                        <span className="text-[11px] font-bold text-white truncate">
                          Step {guidedLessonStep.stepNum}/{guidedLessonStep.totalSteps}: Play <strong className="text-emerald-400 font-mono">{guidedLessonStep.san}</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-300 truncate mt-0.5">
                      {guidedLessonStep.status === 'active' ? guidedLessonStep.note : guidedLessonStep.message}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold shrink-0"
                    title="Exit Guided Lesson"
                  >
                    Exit Lesson
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {openingCoach.opening ? (
                      <>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-black text-[10px] shrink-0">
                          {openingCoach.opening.eco}
                        </span>
                        <span className="font-bold text-white truncate text-xs">
                          {openingCoach.opening.name}
                        </span>
                        <span className={`hidden sm:inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          openingCoach.opening.category === 'defense'
                            ? 'bg-fuchsia-500/20 text-fuchsia-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {openingCoach.opening.category === 'defense' ? 'Defense' : 'Opening'}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-[11px] truncate">
                        📖 Make a first move (e.g. 1. e4 or 1. d4) or click <strong className="text-emerald-400">Learn</strong>
                      </span>
                    )}
                  </div>
                  {openingCoach.nextBookMoves?.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-500 font-bold">Book:</span>
                      {openingCoach.nextBookMoves.slice(0, 3).map((bm, i) => (
                        <button
                          key={i}
                          onMouseEnter={() => bm.coords && setHoveredBookMove({ ...bm.coords, san: bm.san, note: bm.note })}
                          onMouseLeave={() => setHoveredBookMove(null)}
                          onClick={() => bm.coords && setHoveredBookMove(prev => (prev?.san === bm.san ? null : { ...bm.coords, san: bm.san, note: bm.note }))}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30"
                          title={`${bm.openingName}: ${bm.note}`}
                        >
                          {bm.san}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{ width: `${boardSize}px`, height: `${boardSize}px` }}
              className={`relative grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border-2 ${theme.border} shadow-2xl transition-colors`}
            >
              {squareIndices.map((sqIdx) => {
                const { col, row } = squareToColRow(sqIdx);
                const isLight = (col + row) % 2 === 0;
                const piece = board[sqIdx];
                const isSelected = selectedSquare === sqIdx;
                const isLegalTarget = legalMoves.some(m => m.to === sqIdx);
                const isCaptureTarget = isLegalTarget && legalMoves.find(m => m.to === sqIdx)?.captured;
                const isLastMoveSq = lastMove && (lastMove.from === sqIdx || lastMove.to === sqIdx);
                const isKingInCheck = sqIdx === kingInCheckSq;
                const isHintTarget = stockfishHint && (stockfishHint.from === sqIdx || stockfishHint.to === sqIdx);
                const isBookGuideSq =
                  (guidedLessonStep?.status === 'active' && (guidedLessonStep.from === sqIdx || guidedLessonStep.to === sqIdx)) ||
                  (hoveredBookMove && (hoveredBookMove.from === sqIdx || hoveredBookMove.to === sqIdx));
                const isBookDestSq =
                  (guidedLessonStep?.status === 'active' && guidedLessonStep.to === sqIdx) ||
                  (hoveredBookMove && hoveredBookMove.to === sqIdx);

                const bgSquareColor = isLight ? theme.light : theme.dark;

                return (
                  <div
                    key={sqIdx}
                    onClick={() => handleSquareClick(sqIdx)}
                    style={{
                      backgroundColor: bgSquareColor,
                      backgroundImage: theme.pattern || undefined,
                      backgroundSize: theme.id === 'cyber' ? '12px 12px' : undefined
                    }}
                    className="relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-colors"
                  >
                    {/* Rank / File Coordinate Labels on Outer Edges */}
                    {col === (isFlipped ? 7 : 0) && (
                      <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-45 pointer-events-none text-slate-400">
                        {8 - row}
                      </span>
                    )}
                    {row === (isFlipped ? 0 : 7) && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-45 pointer-events-none text-slate-400">
                        {String.fromCharCode('a'.charCodeAt(0) + col)}
                      </span>
                    )}

                    {/* Last Move Highlight */}
                    {isLastMoveSq && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: theme.lastMove }}
                      />
                    )}

                    {/* Selected Square Glow */}
                    {isSelected && (
                      <div
                        className="absolute inset-0 border-2 border-cyan-400 pointer-events-none shadow-inner"
                        style={{ backgroundColor: theme.highlight }}
                      />
                    )}

                    {/* Stockfish Hint Highlight */}
                    {isHintTarget && (
                      <div
                        className="absolute inset-0 border-2 border-amber-400 animate-pulse pointer-events-none"
                        style={{ backgroundColor: theme.hint }}
                      />
                    )}

                    {/* Guided Book / Lesson Move Highlight */}
                    {isBookGuideSq && (
                      <div
                        className="absolute inset-0 border-2 border-emerald-400 animate-pulse pointer-events-none"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.35)' }}
                      >
                        {isBookDestSq && (
                          <span className="absolute top-0.5 right-0.5 px-1 rounded bg-emerald-500 text-slate-950 font-black text-[8px] uppercase shadow">
                            Book
                          </span>
                        )}
                      </div>
                    )}

                    {/* Check Warning on King */}
                    {isKingInCheck && (
                      <div className="absolute inset-0 bg-rose-600/60 animate-ping pointer-events-none rounded" />
                    )}

                    {/* Legal Move Indicator (Quiet Dot) */}
                    {isLegalTarget && !isCaptureTarget && (
                      <div className="absolute w-3 h-3 rounded-full bg-cyan-400/75 pointer-events-none shadow-sm" />
                    )}

                    {/* Legal Move Indicator (Capture Ring) */}
                    {isCaptureTarget && (
                      <div className="absolute inset-1 rounded-full border-2 border-rose-500/80 bg-rose-500/20 pointer-events-none shadow-sm" />
                    )}

                    {/* Chess Piece Graphic */}
                    {piece && (
                      <div className="relative w-[82%] h-[82%] transition-transform hover:scale-105 active:scale-95">
                        <ChessPiece piece={piece} skin={pieceSkin} customColors={customColors} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pawn Promotion Modal */}
            {pendingPromotion && (
              <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Promote Pawn To:
                  </div>
                  <div className="flex items-center gap-3">
                    {['q', 'r', 'b', 'n'].map((type) => {
                      const displayPiece = turn === 'w' ? type.toUpperCase() : type.toLowerCase();
                      return (
                        <button
                          key={type}
                          onClick={() => handlePromotionSelect(type)}
                          className="w-14 h-14 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                        >
                          <ChessPiece piece={displayPiece} skin={pieceSkin} customColors={customColors} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: MOVE HISTORY & NOTATION */}
        <div className="hidden lg:flex w-56 h-full flex-none flex-col bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Swords size={14} className="text-cyan-400" />
              <span>Move Log</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {history.length} Plies
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 text-xs font-mono space-y-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-[11px] italic">
                Moves will appear here
              </div>
            ) : (
              Array.from({ length: Math.ceil(history.length / 2) }).map((_, moveIdx) => {
                const wPly = moveIdx * 2;
                const bPly = moveIdx * 2 + 1;
                const whiteMove = history[wPly];
                const blackMove = history[bPly];
                const wQual = moveQualities[wPly];
                const bQual = moveQualities[bPly];
                return (
                  <div
                    key={moveIdx}
                    className="grid grid-cols-7 items-center py-1 px-1.5 rounded hover:bg-slate-800/60 transition gap-1"
                  >
                    <span className="col-span-1 text-slate-500">{moveIdx + 1}.</span>
                    <div className="col-span-3 flex items-center gap-1 min-w-0" title={wQual?.tip || ''}>
                      <span className="font-semibold text-slate-200 truncate">{whiteMove?.san || ''}</span>
                      {wQual && (
                        <span className={`text-[8px] px-1 rounded border leading-tight shrink-0 ${wQual.color}`}>
                          {wQual.badge.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center gap-1 min-w-0" title={bQual?.tip || ''}>
                      <span className="font-semibold text-slate-400 truncate">{blackMove?.san || ''}</span>
                      {bQual && (
                        <span className={`text-[8px] px-1 rounded border leading-tight shrink-0 ${bQual.color}`}>
                          {bQual.badge.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={historyEndRef} />
          </div>

          {/* Quick FEN Copy */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate pr-2 font-mono">{engine.getFen()}</span>
            <button
              onClick={() => navigator.clipboard.writeText(engine.getFen())}
              className="flex-none px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Copy FEN
            </button>
          </div>
        </div>
      </div>

      {/* OPENING & DEFENSE ACADEMY MODAL */}
      {showLearnModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-3xl max-h-full overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide">
                    Chess Opening & Defense Academy
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pick a famous White Opening or Black Defense to practice step-by-step on the board with guided moves
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLearnModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Tabs: White Openings vs Black Defenses */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setLearnTab('opening')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    learnTab === 'opening'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Swords size={13} />
                  <span>White Openings (Attack & Control)</span>
                </button>
                <button
                  onClick={() => setLearnTab('defense')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    learnTab === 'defense'
                      ? 'bg-fuchsia-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield size={13} />
                  <span>Black Defenses (Counter-Attack)</span>
                </button>
              </div>

              {activeLesson && (
                <button
                  onClick={() => { setActiveLesson(null); setShowLearnModal(false); }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Clear Active Lesson
                </button>
              )}
            </div>

            {/* Grid of Openings or Defenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CHESS_OPENINGS_DB.filter(
                entry => entry.category === learnTab && entry.moves.length >= 3
              ).map((entry) => {
                const isSelectedLesson = activeLesson?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                      isSelectedLesson
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-black text-[10px]">
                            {entry.eco}
                          </span>
                          <h4 className="font-black text-white text-sm">
                            {entry.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          Play as {entry.side === 'w' ? 'White' : 'Black'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {entry.summary}
                      </p>

                      {/* Move Line Pill */}
                      <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-nowrap">
                        {entry.moves.map((m, idx) => (
                          <span key={idx} className="mr-1.5">
                            {idx % 2 === 0 ? <span className="text-slate-500">{Math.floor(idx / 2) + 1}.</span> : null}
                            <span className={idx % 2 === 0 ? 'text-white font-bold' : 'text-cyan-300'}> {m}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartLesson(entry)}
                      className={`w-full py-2 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                        entry.category === 'defense'
                          ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <GraduationCap size={14} />
                      <span>Practice This {entry.category === 'defense' ? 'Defense' : 'Opening'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SKINS & BOARD CUSTOMIZER MODAL */}
      {showSkinModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-2xl max-h-full overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400">
                  <Palette size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide">
                    Board & Piece Skins Studio
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mix and match custom piece sets, board finishes, or build your own palette
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkinModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* SECTION 1: PIECE SKINS */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-2.5 flex items-center justify-between">
                <span>1. Piece Skins</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Active: {PIECE_SKINS.find(s => s.id === pieceSkin)?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PIECE_SKINS.map((s) => {
                  const isActive = pieceSkin === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setPieceSkin(s.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                        isActive
                          ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Live Piece Preview */}
                      <div
                        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 p-1 border border-slate-800/80"
                        style={{
                          background: `linear-gradient(90deg, ${theme.dark} 50%, ${theme.light} 50%)`
                        }}
                      >
                        <div className="w-9 h-9">
                          <ChessPiece piece="N" skin={s.id} customColors={customColors} />
                        </div>
                        <div className="w-9 h-9">
                          <ChessPiece piece="k" skin={s.id} customColors={customColors} />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span className="truncate">{s.name}</span>
                          {isActive && <Check size={12} className="text-cyan-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {s.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Piece Color Pickers */}
              {pieceSkin === 'custom' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-bold text-cyan-300">Custom Piece Colors:</span>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="color"
                      value={customColors.whitePiece}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, whitePiece: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span>White Team</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="color"
                      value={customColors.blackPiece}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, blackPiece: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span>Black Team</span>
                  </label>
                </div>
              )}
            </div>

            {/* SECTION 2: BOARD SKINS */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-fuchsia-400 mb-2.5 flex items-center justify-between">
                <span>2. Board Finishes</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Active: {theme.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BOARD_THEMES.map((b, idx) => {
                  const isActive = themeIdx === idx;
                  const lightCol = b.id === 'custom' ? customColors.lightSquare : b.light;
                  const darkCol = b.id === 'custom' ? customColors.darkSquare : b.dark;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setThemeIdx(idx)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-fuchsia-500/15 border-fuchsia-400 shadow-lg shadow-fuchsia-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* 2x2 Mini Board Swatch */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-slate-700 shrink-0 shadow">
                        <div style={{ backgroundColor: lightCol }} />
                        <div style={{ backgroundColor: darkCol }} />
                        <div style={{ backgroundColor: darkCol }} />
                        <div style={{ backgroundColor: lightCol }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white truncate flex items-center justify-between">
                          <span className="truncate">{b.name}</span>
                          {isActive && <Check size={12} className="text-fuchsia-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {lightCol} / {darkCol}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Board Color Pickers */}
              {baseTheme.id === 'custom' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-fuchsia-500/30 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-bold text-fuchsia-300">Custom Board Squares:</span>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="color"
                      value={customColors.lightSquare}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, lightSquare: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span>Light Squares</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="color"
                      value={customColors.darkSquare}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, darkSquare: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span>Dark Squares</span>
                  </label>
                </div>
              )}
            </div>

            {/* Done button */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSkinModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {showGameOverModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <Trophy size={32} />
            </div>

            <h2 className="text-xl font-black text-white tracking-wide">
              {gameStatus.winner ? `${gameStatus.winner} Wins!` : 'Game Drawn!'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {gameStatus.reason}
            </p>

            {xpAwarded && (
              <div className="mt-4 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 animate-bounce">
                <Sparkles size={14} />
                <span>+25 XP Awarded to Winner!</span>
              </div>
            )}

            <div className="w-full mt-6 flex flex-col gap-2">
              <button
                onClick={handleNewGame}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
              >
                Play Rematch
              </button>
              <button
                onClick={() => setShowGameOverModal(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Review Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
