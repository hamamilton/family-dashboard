/**
 * Stockfish Engine Web Worker Service
 * Manages communication with Stockfish using the Universal Chess Interface (UCI) protocol.
 * Strictly separates position evaluation from engine moves and hints to ensure
 * the engine only moves when explicitly requested.
 */

export class StockfishService {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.isThinking = false;
    this.currentSkillLevel = 10;
    this.currentMode = 'none'; // 'none' | 'bot_move' | 'hint' | 'eval'

    // Callbacks
    this.onEvaluation = null; // ({ cp, mate, depth, pv }) => {}
    this.onBestMove = null;   // (bestMoveUci, ponder) => {}
    this.onHint = null;       // (bestMoveUci, ponder) => {}
    this.onReady = null;
    this.onError = null;
    this.onFallbackCalculate = null;

    this.useFallback = false;
  }

  init() {
    if (this.worker || typeof window === 'undefined') return;

    try {
      // First attempt: local worker from public folder
      this.worker = new Worker('/stockfish.js');
      this._setupWorker();
    } catch (err) {
      console.warn('Failed to load local /stockfish.js worker, trying blob fallback...', err);
      try {
        const cdnUrl = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';
        const blob = new Blob([`importScripts("${cdnUrl}");`], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        this.worker = new Worker(blobUrl);
        this._setupWorker();
      } catch (err2) {
        console.error('All Stockfish worker initializations failed; using internal evaluator.', err2);
        this.useFallback = true;
        this.isReady = true;
        if (this.onReady) this.onReady();
      }
    }
  }

  _setupWorker() {
    if (!this.worker) return;

    this.worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data.trim() : '';
      if (!line) return;

      this._handleUciMessage(line);
    };

    this.worker.onerror = (err) => {
      console.warn('Stockfish Worker error event:', err);
      if (!this.isReady) {
        this.useFallback = true;
        this.isReady = true;
        if (this.onReady) this.onReady();
      }
      if (this.onError) this.onError(err);
    };

    // Send UCI handshake
    this.sendCommand('uci');
  }

  sendCommand(cmd) {
    if (this.worker && !this.useFallback) {
      this.worker.postMessage(cmd);
    }
  }

  _handleUciMessage(line) {
    // Check for UCI OK
    if (line === 'uciok') {
      this.isReady = true;
      this.setSkillLevel(this.currentSkillLevel);
      this.sendCommand('isready');
      return;
    }

    if (line === 'readyok') {
      this.isReady = true;
      if (this.onReady) this.onReady();
      return;
    }

    // Parse Evaluation: info depth 12 score cp 45 ... pv e2e4 ...
    if (line.startsWith('info') && (line.includes('score cp') || line.includes('score mate'))) {
      const cpMatch = line.match(/score cp (-?\d+)/);
      const mateMatch = line.match(/score mate (-?\d+)/);
      const depthMatch = line.match(/depth (\d+)/);
      const pvMatch = line.match(/ pv (.*)$/);

      let scoreCp = null;
      let mate = null;
      if (cpMatch) scoreCp = parseInt(cpMatch[1], 10);
      if (mateMatch) mate = parseInt(mateMatch[1], 10);
      const depth = depthMatch ? parseInt(depthMatch[1], 10) : null;
      const pv = pvMatch ? pvMatch[1].trim() : null;

      if (this.onEvaluation) {
        this.onEvaluation({ cp: scoreCp, mate, depth, pv });
      }
    }

    // Parse Best Move
    if (line.startsWith('bestmove')) {
      const mode = this.currentMode;
      this.currentMode = 'none';
      this.isThinking = false;

      const parts = line.split(/\s+/);
      const bestMove = parts[1];
      const ponder = parts[3] || null;

      if (!bestMove || bestMove === '(none)') return;

      // Only invoke onBestMove if we explicitly asked Stockfish to play a move!
      if (mode === 'bot_move' && this.onBestMove) {
        this.onBestMove(bestMove, ponder);
      } else if (mode === 'hint' && this.onHint) {
        this.onHint(bestMove, ponder);
      }
      // If mode was 'eval', bestmove is intentionally ignored!
    }
  }

  setSkillLevel(level) {
    this.currentSkillLevel = Math.max(0, Math.min(20, level));
    if (this.worker && !this.useFallback) {
      this.sendCommand(`setoption name Skill Level value ${this.currentSkillLevel}`);
    }
  }

  startNewGame() {
    this.stop();
    this.sendCommand('ucinewgame');
    this.sendCommand('isready');
  }

  stop() {
    this.currentMode = 'none';
    this.isThinking = false;
    this.sendCommand('stop');
  }

  /**
   * Request Stockfish to calculate and play a move for its turn.
   */
  findBestMove(fen, options = {}) {
    this.stop();
    this.currentMode = 'bot_move';
    this.isThinking = true;

    const { depth = 10, movetime = 1200, skillLevel = this.currentSkillLevel } = options;

    if (skillLevel !== this.currentSkillLevel) {
      this.setSkillLevel(skillLevel);
    }

    if (this.useFallback) {
      setTimeout(() => {
        if (this.currentMode !== 'bot_move') return;
        this.currentMode = 'none';
        this.isThinking = false;
        if (this.onFallbackCalculate) {
          const move = this.onFallbackCalculate();
          if (this.onBestMove && move) {
            this.onBestMove(move);
          }
        }
      }, 400);
      return;
    }

    this.sendCommand(`position fen ${fen}`);
    if (movetime) {
      this.sendCommand(`go movetime ${movetime} depth ${depth}`);
    } else {
      this.sendCommand(`go depth ${depth}`);
    }
  }

  /**
   * Request Stockfish to suggest a hint move without playing it.
   */
  findHint(fen, options = {}) {
    this.stop();
    this.currentMode = 'hint';
    this.isThinking = true;

    const { depth = 12, movetime = 1000 } = options;

    if (this.useFallback) {
      setTimeout(() => {
        if (this.currentMode !== 'hint') return;
        this.currentMode = 'none';
        this.isThinking = false;
        if (this.onFallbackCalculate) {
          const move = this.onFallbackCalculate();
          if (this.onHint && move) {
            this.onHint(move);
          }
        }
      }, 300);
      return;
    }

    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go movetime ${movetime} depth ${depth}`);
  }

  /**
   * Request evaluation for current position without making a move or triggering a turn.
   */
  evaluatePosition(fen, depth = 10) {
    if (this.isThinking && (this.currentMode === 'bot_move' || this.currentMode === 'hint')) {
      return; // Do not interrupt an active move or hint calculation
    }
    if (this.useFallback) return;

    this.currentMode = 'eval';
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }

  terminate() {
    if (this.worker) {
      try {
        this.sendCommand('quit');
        this.worker.terminate();
      } catch (e) {
        // ignore
      }
      this.worker = null;
    }
  }
}
