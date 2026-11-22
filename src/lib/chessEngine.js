/**
 * Complete, standalone chess rules engine.
 * Handles board representation, legal move generation, FEN parsing/serialization,
 * check/checkmate/stalemate detection, castling, en passant, pawn promotion,
 * threefold repetition, 50-move rule, algebraic notation (SAN), and a built-in
 * minimax fallback evaluator.
 */

export const SQUARES = {
  a8: 0,  b8: 1,  c8: 2,  d8: 3,  e8: 4,  f8: 5,  g8: 6,  h8: 7,
  a7: 8,  b7: 9,  c7: 10, d7: 11, e7: 12, f7: 13, g7: 14, h7: 15,
  a6: 16, b6: 17, c6: 18, d6: 19, e6: 20, f6: 21, g6: 22, h6: 23,
  a5: 24, b5: 25, c5: 26, d5: 27, e5: 28, f5: 29, g5: 30, h5: 31,
  a4: 32, b4: 33, c4: 34, d4: 35, e4: 36, f4: 37, g4: 38, h4: 39,
  a3: 40, b3: 41, c3: 42, d3: 43, e3: 44, f3: 45, g3: 46, h3: 47,
  a2: 48, b2: 49, c2: 50, d2: 51, e2: 52, f2: 53, g2: 54, h2: 55,
  a1: 56, b1: 57, c1: 58, d1: 59, e1: 60, f1: 61, g1: 62, h1: 63
};

export const SQUARE_NAMES = Object.keys(SQUARES);

export const DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const PIECE_VALUES = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000
};

// Piece-square evaluation tables for fallback AI
const PST = {
  P: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  N: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  B: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  R: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
  ],
  Q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  K: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

export function isWhite(p) {
  return p && p >= 'A' && p <= 'Z';
}

export function isBlack(p) {
  return p && p >= 'a' && p <= 'z';
}

export function squareToColRow(idx) {
  return { col: idx % 8, row: Math.floor(idx / 8) };
}

export function colRowToSquare(col, row) {
  return row * 8 + col;
}

export function squareToName(idx) {
  if (idx < 0 || idx > 63) return '-';
  const file = String.fromCharCode('a'.charCodeAt(0) + (idx % 8));
  const rank = 8 - Math.floor(idx / 8);
  return `${file}${rank}`;
}

export function nameToSquare(name) {
  if (!name || name.length < 2) return -1;
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(name[1], 10);
  if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
  return row * 8 + col;
}

export class ChessGameEngine {
  constructor(fen = DEFAULT_POSITION) {
    this.board = new Array(64).fill(null);
    this.turn = 'w';
    this.castling = { K: true, Q: true, k: true, q: true };
    this.epSquare = -1;
    this.halfMoves = 0;
    this.fullMoves = 1;
    this.history = []; // array of move objects
    this.positionHistory = []; // array of FEN strings without half/full moves for repetition
    this.load(fen);
  }

  clone() {
    const copy = new ChessGameEngine(this.getFen());
    copy.history = [...this.history];
    copy.positionHistory = [...this.positionHistory];
    return copy;
  }

  load(fen) {
    const parts = (fen || DEFAULT_POSITION).trim().split(/\s+/);
    const piecePlacement = parts[0];
    this.turn = parts[1] || 'w';
    const castling = parts[2] || '-';
    const ep = parts[3] || '-';
    this.halfMoves = parseInt(parts[4] || '0', 10);
    this.fullMoves = parseInt(parts[5] || '1', 10);

    this.castling = {
      K: castling.includes('K'),
      Q: castling.includes('Q'),
      k: castling.includes('k'),
      q: castling.includes('q')
    };

    this.epSquare = ep === '-' ? -1 : nameToSquare(ep);
    this.board = new Array(64).fill(null);

    let row = 0;
    let col = 0;
    for (const char of piecePlacement) {
      if (char === '/') {
        row++;
        col = 0;
      } else if (char >= '1' && char <= '8') {
        col += parseInt(char, 10);
      } else {
        const idx = colRowToSquare(col, row);
        this.board[idx] = char;
        col++;
      }
    }

    this.history = [];
    this.positionHistory = [this.getRepetitionKey()];
  }

  getRepetitionKey() {
    const parts = this.getFen().split(' ');
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
  }

  getFen() {
    let placement = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.board[colRowToSquare(c, r)];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            placement += emptyCount;
            emptyCount = 0;
          }
          placement += piece;
        }
      }
      if (emptyCount > 0) placement += emptyCount;
      if (r < 7) placement += '/';
    }

    let castlingStr = '';
    if (this.castling.K) castlingStr += 'K';
    if (this.castling.Q) castlingStr += 'Q';
    if (this.castling.k) castlingStr += 'k';
    if (this.castling.q) castlingStr += 'q';
    if (!castlingStr) castlingStr = '-';

    const epStr = this.epSquare !== -1 ? squareToName(this.epSquare) : '-';

    return `${placement} ${this.turn} ${castlingStr} ${epStr} ${this.halfMoves} ${this.fullMoves}`;
  }

  getPiece(square) {
    const idx = typeof square === 'string' ? nameToSquare(square) : square;
    return this.board[idx] || null;
  }

  isSquareAttacked(squareIdx, attackerColor) {
    const isAttackerWhite = attackerColor === 'w';

    // 1. Pawn attacks
    const pawnChar = isAttackerWhite ? 'P' : 'p';
    const { col, row } = squareToColRow(squareIdx);
    const pawnSourceRow = isAttackerWhite ? row + 1 : row - 1;
    if (pawnSourceRow >= 0 && pawnSourceRow < 8) {
      if (col > 0 && this.board[colRowToSquare(col - 1, pawnSourceRow)] === pawnChar) return true;
      if (col < 7 && this.board[colRowToSquare(col + 1, pawnSourceRow)] === pawnChar) return true;
    }

    // 2. Knight attacks
    const knightChar = isAttackerWhite ? 'N' : 'n';
    const knightDeltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2],  [1, 2],  [2, -1],  [2, 1]
    ];
    for (const [dc, dr] of knightDeltas) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
        if (this.board[colRowToSquare(nc, nr)] === knightChar) return true;
      }
    }

    // 3. King attacks
    const kingChar = isAttackerWhite ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nc = col + dc;
        const nr = row + dr;
        if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
          if (this.board[colRowToSquare(nc, nr)] === kingChar) return true;
        }
      }
    }

    // 4. Sliding: Bishop / Queen (Diagonals)
    const bqChars = isAttackerWhite ? ['B', 'Q'] : ['b', 'q'];
    const diagDirections = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [dc, dr] of diagDirections) {
      let c = col + dc;
      let r = row + dr;
      while (c >= 0 && c < 8 && r >= 0 && r < 8) {
        const p = this.board[colRowToSquare(c, r)];
        if (p) {
          if (bqChars.includes(p)) return true;
          break; // blocked
        }
        c += dc;
        r += dr;
      }
    }

    // 5. Sliding: Rook / Queen (Orthogonals)
    const rqChars = isAttackerWhite ? ['R', 'Q'] : ['r', 'q'];
    const orthoDirections = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dc, dr] of orthoDirections) {
      let c = col + dc;
      let r = row + dr;
      while (c >= 0 && c < 8 && r >= 0 && r < 8) {
        const p = this.board[colRowToSquare(c, r)];
        if (p) {
          if (rqChars.includes(p)) return true;
          break; // blocked
        }
        c += dc;
        r += dr;
      }
    }

    return false;
  }

  getKingSquare(color = this.turn) {
    const kingChar = color === 'w' ? 'K' : 'k';
    return this.board.indexOf(kingChar);
  }

  isInCheck(color = this.turn) {
    const kingSq = this.getKingSquare(color);
    if (kingSq === -1) return false;
    const opponent = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(kingSq, opponent);
  }

  generatePseudoLegalMoves(turn = this.turn) {
    const moves = [];
    const isW = turn === 'w';

    for (let from = 0; from < 64; from++) {
      const piece = this.board[from];
      if (!piece) continue;
      if (isW && !isWhite(piece)) continue;
      if (!isW && !isBlack(piece)) continue;

      const { col, row } = squareToColRow(from);
      const pieceLower = piece.toLowerCase();

      // PAWNS
      if (pieceLower === 'p') {
        const direction = isW ? -1 : 1;
        const startRow = isW ? 6 : 1;
        const promoRow = isW ? 0 : 7;

        // 1-square forward
        const nextRow = row + direction;
        if (nextRow >= 0 && nextRow < 8) {
          const oneSq = colRowToSquare(col, nextRow);
          if (!this.board[oneSq]) {
            if (nextRow === promoRow) {
              for (const promo of ['q', 'r', 'b', 'n']) {
                moves.push({ from, to: oneSq, piece, promotion: promo });
              }
            } else {
              moves.push({ from, to: oneSq, piece });
            }

            // 2-square forward from home row
            if (row === startRow) {
              const twoSq = colRowToSquare(col, row + 2 * direction);
              if (!this.board[twoSq]) {
                moves.push({ from, to: twoSq, piece, isDoublePawn: true });
              }
            }
          }
        }

        // Diagonal captures
        for (const dc of [-1, 1]) {
          const targetCol = col + dc;
          if (targetCol >= 0 && targetCol < 8 && nextRow >= 0 && nextRow < 8) {
            const targetSq = colRowToSquare(targetCol, nextRow);
            const targetPiece = this.board[targetSq];

            // Regular capture
            if (targetPiece && (isW ? isBlack(targetPiece) : isWhite(targetPiece))) {
              if (nextRow === promoRow) {
                for (const promo of ['q', 'r', 'b', 'n']) {
                  moves.push({ from, to: targetSq, piece, captured: targetPiece, promotion: promo });
                }
              } else {
                moves.push({ from, to: targetSq, piece, captured: targetPiece });
              }
            }

            // En passant capture
            if (targetSq === this.epSquare) {
              const epPawnSq = colRowToSquare(targetCol, row);
              const epCaptured = this.board[epPawnSq];
              moves.push({
                from,
                to: targetSq,
                piece,
                captured: epCaptured,
                isEnPassant: true
              });
            }
          }
        }
      }

      // KNIGHTS
      else if (pieceLower === 'n') {
        const knightDeltas = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2],  [1, 2],  [2, -1],  [2, 1]
        ];
        for (const [dc, dr] of knightDeltas) {
          const nc = col + dc;
          const nr = row + dr;
          if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
            const targetSq = colRowToSquare(nc, nr);
            const targetPiece = this.board[targetSq];
            if (!targetPiece) {
              moves.push({ from, to: targetSq, piece });
            } else if (isW ? isBlack(targetPiece) : isWhite(targetPiece)) {
              moves.push({ from, to: targetSq, piece, captured: targetPiece });
            }
          }
        }
      }

      // BISHOPS / ROOKS / QUEENS (Sliding)
      else if (pieceLower === 'b' || pieceLower === 'r' || pieceLower === 'q') {
        const dirs = [];
        if (pieceLower === 'b' || pieceLower === 'q') {
          dirs.push([-1, -1], [1, -1], [-1, 1], [1, 1]);
        }
        if (pieceLower === 'r' || pieceLower === 'q') {
          dirs.push([0, -1], [0, 1], [-1, 0], [1, 0]);
        }

        for (const [dc, dr] of dirs) {
          let c = col + dc;
          let r = row + dr;
          while (c >= 0 && c < 8 && r >= 0 && r < 8) {
            const targetSq = colRowToSquare(c, r);
            const targetPiece = this.board[targetSq];
            if (!targetPiece) {
              moves.push({ from, to: targetSq, piece });
            } else {
              if (isW ? isBlack(targetPiece) : isWhite(targetPiece)) {
                moves.push({ from, to: targetSq, piece, captured: targetPiece });
              }
              break; // ray blocked
            }
            c += dc;
            r += dr;
          }
        }
      }

      // KING
      else if (pieceLower === 'k') {
        // Normal king moves (1 square)
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nc = col + dc;
            const nr = row + dr;
            if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
              const targetSq = colRowToSquare(nc, nr);
              const targetPiece = this.board[targetSq];
              if (!targetPiece) {
                moves.push({ from, to: targetSq, piece });
              } else if (isW ? isBlack(targetPiece) : isWhite(targetPiece)) {
                moves.push({ from, to: targetSq, piece, captured: targetPiece });
              }
            }
          }
        }

        // Castling moves
        const opponent = isW ? 'b' : 'w';
        if (isW && from === 60) { // e1
          // Kingside O-O
          if (this.castling.K && !this.board[61] && !this.board[62] && this.board[63] === 'R') {
            if (!this.isSquareAttacked(60, opponent) &&
                !this.isSquareAttacked(61, opponent) &&
                !this.isSquareAttacked(62, opponent)) {
              moves.push({ from: 60, to: 62, piece: 'K', isCastle: 'K' });
            }
          }
          // Queenside O-O-O
          if (this.castling.Q && !this.board[59] && !this.board[58] && !this.board[57] && this.board[56] === 'R') {
            if (!this.isSquareAttacked(60, opponent) &&
                !this.isSquareAttacked(59, opponent) &&
                !this.isSquareAttacked(58, opponent)) {
              moves.push({ from: 60, to: 58, piece: 'K', isCastle: 'Q' });
            }
          }
        } else if (!isW && from === 4) { // e8
          // Kingside o-o
          if (this.castling.k && !this.board[5] && !this.board[6] && this.board[7] === 'r') {
            if (!this.isSquareAttacked(4, opponent) &&
                !this.isSquareAttacked(5, opponent) &&
                !this.isSquareAttacked(6, opponent)) {
              moves.push({ from: 4, to: 6, piece: 'k', isCastle: 'k' });
            }
          }
          // Queenside o-o-o
          if (this.castling.q && !this.board[3] && !this.board[2] && !this.board[1] && this.board[0] === 'r') {
            if (!this.isSquareAttacked(4, opponent) &&
                !this.isSquareAttacked(3, opponent) &&
                !this.isSquareAttacked(2, opponent)) {
              moves.push({ from: 4, to: 2, piece: 'k', isCastle: 'q' });
            }
          }
        }
      }
    }

    return moves;
  }

  makeMoveInternal(move) {
    const { from, to, piece, promotion, isCastle, isEnPassant, isDoublePawn } = move;
    const isW = isWhite(piece);
    const prevCastling = { ...this.castling };
    const prevEp = this.epSquare;
    const prevHalfMoves = this.halfMoves;

    // Remove from origin
    this.board[from] = null;

    // Handle en passant capture removal
    if (isEnPassant) {
      const { col: toCol } = squareToColRow(to);
      const { row: fromRow } = squareToColRow(from);
      this.board[colRowToSquare(toCol, fromRow)] = null;
    }

    // Handle castling rook movement
    if (isCastle) {
      if (isCastle === 'K') {
        this.board[63] = null;
        this.board[61] = 'R';
      } else if (isCastle === 'Q') {
        this.board[56] = null;
        this.board[59] = 'R';
      } else if (isCastle === 'k') {
        this.board[7] = null;
        this.board[5] = 'r';
      } else if (isCastle === 'q') {
        this.board[0] = null;
        this.board[3] = 'r';
      }
    }

    // Place piece on destination (with promotion if applicable)
    let placedPiece = piece;
    if (promotion) {
      placedPiece = isW ? promotion.toUpperCase() : promotion.toLowerCase();
    }
    this.board[to] = placedPiece;

    // Update En Passant square
    if (isDoublePawn) {
      const { col, row } = squareToColRow(from);
      const epRow = isW ? row - 1 : row + 1;
      this.epSquare = colRowToSquare(col, epRow);
    } else {
      this.epSquare = -1;
    }

    // Update castling rights if King or Rook moved or was captured
    if (piece === 'K') {
      this.castling.K = false;
      this.castling.Q = false;
    } else if (piece === 'k') {
      this.castling.k = false;
      this.castling.q = false;
    }

    if (from === 56 || to === 56) this.castling.Q = false;
    if (from === 63 || to === 63) this.castling.K = false;
    if (from === 0 || to === 0) this.castling.q = false;
    if (from === 7 || to === 7) this.castling.k = false;

    // Halfmove clock reset on pawn move or capture
    if (piece.toLowerCase() === 'p' || move.captured) {
      this.halfMoves = 0;
    } else {
      this.halfMoves++;
    }

    if (!isW) {
      this.fullMoves++;
    }

    this.turn = isW ? 'b' : 'w';

    return { prevCastling, prevEp, prevHalfMoves };
  }

  undoMoveInternal(move, state) {
    const { from, to, piece, captured, isCastle, isEnPassant } = move;
    const isW = isWhite(piece);

    this.turn = isW ? 'w' : 'b';
    this.castling = state.prevCastling;
    this.epSquare = state.prevEp;
    this.halfMoves = state.prevHalfMoves;
    if (!isW) {
      this.fullMoves--;
    }

    // Revert piece to origin
    this.board[from] = piece;
    this.board[to] = null;

    // Restore captured piece
    if (isEnPassant) {
      const { col: toCol } = squareToColRow(to);
      const { row: fromRow } = squareToColRow(from);
      this.board[colRowToSquare(toCol, fromRow)] = captured;
    } else if (captured) {
      this.board[to] = captured;
    }

    // Restore rook if castled
    if (isCastle) {
      if (isCastle === 'K') {
        this.board[61] = null;
        this.board[63] = 'R';
      } else if (isCastle === 'Q') {
        this.board[59] = null;
        this.board[56] = 'R';
      } else if (isCastle === 'k') {
        this.board[5] = null;
        this.board[7] = 'r';
      } else if (isCastle === 'q') {
        this.board[3] = null;
        this.board[0] = 'r';
      }
    }
  }

  getLegalMoves(turn = this.turn) {
    const pseudo = this.generatePseudoLegalMoves(turn);
    const legal = [];

    for (const move of pseudo) {
      const state = this.makeMoveInternal(move);
      // King must not be in check after own move
      if (!this.isInCheck(turn)) {
        legal.push(move);
      }
      this.undoMoveInternal(move, state);
    }

    return legal;
  }

  getLegalMovesForSquare(squareIdx) {
    const idx = typeof squareIdx === 'string' ? nameToSquare(squareIdx) : squareIdx;
    return this.getLegalMoves().filter(m => m.from === idx);
  }

  // Convert move object to Standard Algebraic Notation (SAN)
  moveToSan(move, legalMoves = null) {
    if (move.isCastle === 'K' || move.isCastle === 'k') return 'O-O';
    if (move.isCastle === 'Q' || move.isCastle === 'q') return 'O-O-O';

    const piece = move.piece;
    const pieceUpper = piece.toUpperCase();
    const isPawn = pieceUpper === 'P';
    const toName = squareToName(move.to);
    const fromName = squareToName(move.from);

    let san = '';

    if (!isPawn) {
      san += pieceUpper;
      // Disambiguation if multiple pieces of same type can reach target
      const list = legalMoves || this.getLegalMoves();
      const ambiguous = list.filter(m =>
        m.to === move.to &&
        m.from !== move.from &&
        m.piece.toUpperCase() === pieceUpper
      );

      if (ambiguous.length > 0) {
        const sameFile = ambiguous.some(m => squareToName(m.from)[0] === fromName[0]);
        const sameRank = ambiguous.some(m => squareToName(m.from)[1] === fromName[1]);
        if (!sameFile) {
          san += fromName[0];
        } else if (!sameRank) {
          san += fromName[1];
        } else {
          san += fromName;
        }
      }
    } else if (move.captured || move.isEnPassant) {
      san += fromName[0];
    }

    if (move.captured || move.isEnPassant) {
      san += 'x';
    }

    san += toName;

    if (move.promotion) {
      san += `=${move.promotion.toUpperCase()}`;
    }

    // Check / Checkmate suffix
    const state = this.makeMoveInternal(move);
    const opponent = this.turn;
    const opponentMoves = this.getLegalMoves(opponent);
    const inCheck = this.isInCheck(opponent);

    if (inCheck) {
      if (opponentMoves.length === 0) {
        san += '#';
      } else {
        san += '+';
      }
    }
    this.undoMoveInternal(move, state);

    return san;
  }

  // Convert UCI string (e.g. "e2e4", "e7e8q") to move object
  uciToMove(uciStr) {
    if (!uciStr || uciStr.length < 4) return null;
    const fromName = uciStr.slice(0, 2);
    const toName = uciStr.slice(2, 4);
    const promo = uciStr.length >= 5 ? uciStr[4].toLowerCase() : null;

    const from = nameToSquare(fromName);
    const to = nameToSquare(toName);

    const legal = this.getLegalMoves();
    return legal.find(m =>
      m.from === from &&
      m.to === to &&
      (!promo || (m.promotion && m.promotion.toLowerCase() === promo))
    ) || null;
  }

  moveToUci(move) {
    let uci = `${squareToName(move.from)}${squareToName(move.to)}`;
    if (move.promotion) {
      uci += move.promotion.toLowerCase();
    }
    return uci;
  }

  playMove(moveInput) {
    let move = moveInput;
    if (typeof moveInput === 'string') {
      move = this.uciToMove(moveInput);
    }
    if (!move) return null;

    // Verify it is in legal moves list
    const legalMoves = this.getLegalMoves();
    const matched = legalMoves.find(m =>
      m.from === move.from &&
      m.to === move.to &&
      (!m.promotion || m.promotion.toLowerCase() === (move.promotion || 'q').toLowerCase())
    );

    if (!matched) return null;

    const san = this.moveToSan(matched, legalMoves);
    const uci = this.moveToUci(matched);
    const prevFen = this.getFen();

    const state = this.makeMoveInternal(matched);

    const record = {
      ...matched,
      san,
      uci,
      fenBefore: prevFen,
      fenAfter: this.getFen(),
      state
    };

    this.history.push(record);
    this.positionHistory.push(this.getRepetitionKey());

    return record;
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();
    this.positionHistory.pop();
    this.undoMoveInternal(last, last.state);
    return last;
  }

  isCheckmate() {
    return this.isInCheck() && this.getLegalMoves().length === 0;
  }

  isStalemate() {
    return !this.isInCheck() && this.getLegalMoves().length === 0;
  }

  isFiftyMoveDraw() {
    return this.halfMoves >= 100;
  }

  isThreefoldRepetition() {
    const key = this.getRepetitionKey();
    let count = 0;
    for (const pos of this.positionHistory) {
      if (pos === key) {
        count++;
        if (count >= 3) return true;
      }
    }
    return false;
  }

  isInsufficientMaterial() {
    const pieces = this.board.filter(Boolean);
    if (pieces.length === 2) return true; // Just Kings

    // King + Bishop or King + Knight vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.toLowerCase() !== 'k');
      if (nonKings.length === 1) {
        const type = nonKings[0].toLowerCase();
        if (type === 'b' || type === 'n') return true;
      }
    }

    // King + Bishop vs King + Bishop with same square color
    if (pieces.length === 4) {
      const nonKings = pieces.filter(p => p.toLowerCase() !== 'k');
      if (nonKings.length === 2 && nonKings.every(p => p.toLowerCase() === 'b')) {
        // Check bishop square colors
        const bSquares = [];
        for (let i = 0; i < 64; i++) {
          if (this.board[i] && this.board[i].toLowerCase() === 'b') {
            const { col, row } = squareToColRow(i);
            bSquares.push((col + row) % 2);
          }
        }
        if (bSquares.length === 2 && bSquares[0] === bSquares[1]) {
          return true;
        }
      }
    }

    return false;
  }

  isGameOver() {
    return (
      this.isCheckmate() ||
      this.isStalemate() ||
      this.isFiftyMoveDraw() ||
      this.isThreefoldRepetition() ||
      this.isInsufficientMaterial()
    );
  }

  getGameStatus() {
    if (this.isCheckmate()) {
      const winner = this.turn === 'w' ? 'Black' : 'White';
      return { over: true, winner, reason: `Checkmate! ${winner} wins.` };
    }
    if (this.isStalemate()) {
      return { over: true, winner: null, reason: 'Draw by Stalemate' };
    }
    if (this.isThreefoldRepetition()) {
      return { over: true, winner: null, reason: 'Draw by Threefold Repetition' };
    }
    if (this.isFiftyMoveDraw()) {
      return { over: true, winner: null, reason: 'Draw by 50-Move Rule' };
    }
    if (this.isInsufficientMaterial()) {
      return { over: true, winner: null, reason: 'Draw by Insufficient Material' };
    }
    if (this.isInCheck()) {
      return { over: false, check: true, reason: `${this.turn === 'w' ? 'White' : 'Black'} is in check!` };
    }
    return { over: false, check: false, reason: 'In Progress' };
  }

  getCapturedPieces() {
    const whiteCaptured = [];
    const blackCaptured = [];

    // Count starting counts
    const startCounts = {
      P: 8, N: 2, B: 2, R: 2, Q: 1,
      p: 8, n: 2, b: 2, r: 2, q: 1
    };

    const currentCounts = {
      P: 0, N: 0, B: 0, R: 0, Q: 0,
      p: 0, n: 0, b: 0, r: 0, q: 0
    };

    for (const p of this.board) {
      if (p && p.toLowerCase() !== 'k') {
        currentCounts[p] = (currentCounts[p] || 0) + 1;
      }
    }

    // Missing white pieces were captured by black
    for (const type of ['P', 'N', 'B', 'R', 'Q']) {
      const missing = Math.max(0, (startCounts[type] || 0) - (currentCounts[type] || 0));
      for (let i = 0; i < missing; i++) blackCaptured.push(type);
    }

    // Missing black pieces were captured by white
    for (const type of ['p', 'n', 'b', 'r', 'q']) {
      const missing = Math.max(0, (startCounts[type] || 0) - (currentCounts[type] || 0));
      for (let i = 0; i < missing; i++) whiteCaptured.push(type);
    }

    const whiteMaterial = whiteCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackMaterial = blackCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);

    return {
      whiteCaptured, // pieces captured by white (black pieces)
      blackCaptured, // pieces captured by black (white pieces)
      diff: Math.round((whiteMaterial - blackMaterial) / 100)
    };
  }

  // Built-in lightweight fallback evaluator (used if worker fails or offline)
  evaluatePosition() {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const piece = this.board[i];
      if (!piece) continue;
      const val = PIECE_VALUES[piece] || 0;
      const type = piece.toUpperCase();
      const pstTable = PST[type];
      let pstVal = 0;
      if (pstTable) {
        pstVal = isWhite(piece) ? pstTable[i] : pstTable[63 - i];
      }
      if (isWhite(piece)) {
        score += val + pstVal;
      } else {
        score -= (val + pstVal);
      }
    }
    return score;
  }

  // Minimax fallback AI with Alpha-Beta pruning
  getFallbackBestMove(depth = 3) {
    const isW = this.turn === 'w';
    let bestMove = null;
    let bestScore = isW ? -Infinity : Infinity;

    const moves = this.getLegalMoves();
    if (moves.length === 0) return null;

    // Simple move ordering: captures first
    moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

    for (const move of moves) {
      const state = this.makeMoveInternal(move);
      const score = this._minimax(depth - 1, -Infinity, Infinity, !isW);
      this.undoMoveInternal(move, state);

      if (isW) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }

  _minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0 || this.isGameOver()) {
      return this.evaluatePosition();
    }

    const moves = this.getLegalMoves();
    if (moves.length === 0) {
      if (this.isInCheck()) {
        return isMaximizing ? -20000 : 20000;
      }
      return 0; // Stalemate
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const state = this.makeMoveInternal(move);
        const ev = this._minimax(depth - 1, alpha, beta, false);
        this.undoMoveInternal(move, state);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const state = this.makeMoveInternal(move);
        const ev = this._minimax(depth - 1, alpha, beta, true);
        this.undoMoveInternal(move, state);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}

