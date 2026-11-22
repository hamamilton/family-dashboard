import React from 'react';

/**
 * High-definition, beautifully styled SVG Chess Pieces
 * Optimized for contrast across dark & light squares.
 */

export function ChessPiece({ piece, className = 'w-full h-full select-none pointer-events-none' }) {
  if (!piece) return null;

  const isWhite = piece >= 'A' && piece <= 'Z';
  const type = piece.toLowerCase();

  // White piece styling: bright ivory/cream gradient with crisp slate outline
  // Black piece styling: deep graphite/slate with bright rim highlight
  const fillWhite = '#f8fafc';
  const strokeWhite = '#1e293b';
  const accentWhite = '#e2e8f0';

  const fillBlack = '#1e293b';
  const strokeBlack = '#0f172a';
  const accentBlack = '#334155';
  const rimBlack = '#94a3b8';

  const fill = isWhite ? fillWhite : fillBlack;
  const stroke = isWhite ? strokeWhite : strokeBlack;
  const accent = isWhite ? accentWhite : accentBlack;

  switch (type) {
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Cross */}
            <path d="M22.5 11.63V6M20 8h5" stroke={isWhite ? strokeWhite : rimBlack} strokeWidth="1.5" />
            {/* Crown Head */}
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill={fill}
              stroke={stroke}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            {/* Body Robes */}
            <path
              d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23v.5C20 16 10.5 13 6.5 19.5c-3 6 6 10.5 6 10.5v7z"
              fill={fill}
              stroke={stroke}
            />
            {/* Robe Fold Accents */}
            <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" stroke={isWhite ? accentWhite : rimBlack} />
            {/* Pedestal Base */}
            <path d="M32 39.5c0 .83-.67 1.5-1.5 1.5h-16c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h16c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Jewels on crown */}
            <circle cx="6" cy="12" r="2" fill={fill} stroke={stroke} />
            <circle cx="14" cy="9" r="2" fill={fill} stroke={stroke} />
            <circle cx="22.5" cy="8" r="2" fill={fill} stroke={stroke} />
            <circle cx="31" cy="9" r="2" fill={fill} stroke={stroke} />
            <circle cx="39" cy="12" r="2" fill={fill} stroke={stroke} />
            {/* Crown spikes & body */}
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.5-14-8 14-8-14-.5 14-7.5-11.5L9 26z"
              fill={fill}
              stroke={stroke}
              strokeLinecap="butt"
            />
            {/* Lower Body */}
            <path
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
              fill={fill}
              stroke={stroke}
            />
            {/* Accents */}
            <path d="M11 38.5a35 35 1 0 0 23 0" stroke={isWhite ? accentWhite : rimBlack} />
            <path d="M11 29a35 35 1 0 1 23 0" stroke={isWhite ? accentWhite : rimBlack} />
            {/* Base */}
            <path d="M32 40.5c0 .83-.67 1.5-1.5 1.5h-16c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h16c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Battlements & Tower */}
            <path
              d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5l1.5-13.5h14l1.5 13.5H14zM11 14h23l1.5-5H31v3h-3.5V9h-5v3H19V9h-3.5v3H12V9L11 14z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17" stroke={isWhite ? accentWhite : rimBlack} />
            <path d="M34 40.5c0 .83-.67 1.5-1.5 1.5h-20c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h20c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Top finial */}
            <circle cx="22.5" cy="8" r="1.5" fill={fill} stroke={stroke} />
            {/* Mitre (Head) */}
            <path
              d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65-6.85-2-12-3.65-5.15-5.5-5.5-11.5-15.5C16.5 18.5 14.65 18.85 11 24c-3.65 5.15-2 12-2 12z"
              fill={fill}
              stroke={stroke}
            />
            {/* Slit in bishop head */}
            <path d="M17.5 26h10M15 30h15" stroke={isWhite ? accentWhite : rimBlack} />
            <path d="M22.5 14.5v6M20 17.5h5" stroke={isWhite ? strokeWhite : rimBlack} />
            {/* Base */}
            <path d="M31.5 39.5c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Horse Head Silhouette */}
            <path
              d="M22 10c-3.5 1-6 4.5-5 8 1 3.5 2 4-1 6-3 2-5 5-5 9 0 3 2 4.5 4 4.5h15c2 0 3-1.5 3-4.5 0-4-3-6-3-9 0-3 1.5-5 1.5-8.5 0-3-2-5.5-4-5.5-1 0-2 .5-3 1.5-1-1.5-2-2-3.5-2-.5 0-1 .5-1.5 1-.5-.5-1-.5-1.5-.5z"
              fill={fill}
              stroke={stroke}
            />
            {/* Mane & Details */}
            <path
              d="M24 18c.5-1.5 2-2 3.5-1.5M26 23c.5-1.5 2-2 3.5-1.5M16 26c1.5 1 3 1 4.5 0"
              stroke={isWhite ? strokeWhite : rimBlack}
            />
            {/* Eye */}
            <circle cx="17.5" cy="15.5" r="1.5" fill={isWhite ? strokeWhite : '#38bdf8'} />
            {/* Base */}
            <path d="M31 39.5c0 .83-.67 1.5-1.5 1.5h-14c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h14c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Head Sphere */}
            <circle cx="22.5" cy="12.5" r="4.5" fill={fill} stroke={stroke} />
            {/* Body */}
            <path
              d="M19.5 18c-3 1.5-5 5.5-4 10.5 1 4.5 2.5 6 2.5 6.5h9c0-.5 1.5-2 2.5-6.5 1-5-1-9-4-10.5h-6z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M16 33.5h13M17 28.5h11" stroke={isWhite ? accentWhite : rimBlack} />
            {/* Base */}
            <path d="M29 39.5c0 .83-.67 1.5-1.5 1.5h-10c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h10c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    default:
      return null;
  }
}

