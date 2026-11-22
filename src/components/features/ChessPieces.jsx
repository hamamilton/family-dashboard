import React from 'react';

/**
 * Piece Skins Catalog & Multi-Style SVG Chess Piece Renderer
 * Supports:
 * - 'classic': Traditional Staunton silhouettes
 * - 'cyber': Glowing cyberpunk neon hologram pieces
 * - 'royal': Metallic Gold vs Brushed Silver/Obsidian with jewel accents
 * - 'geometric': Modern Bauhaus minimalist geometric shapes
 * - 'pixel': Retro 8-bit arcade pixel art pieces
 * - 'fantasy': Playful crested family badge medallions
 * - 'custom': Classic Staunton with user-selected custom colors
 */

export const PIECE_SKINS = [
  {
    id: 'classic',
    name: 'Classic Staunton',
    desc: 'Timeless tournament ivory & slate',
    previewWhite: '#f8fafc',
    previewBlack: '#1e293b'
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    desc: 'Holographic cyan vs magenta wireframe',
    previewWhite: '#22d3ee',
    previewBlack: '#f472b6'
  },
  {
    id: 'royal',
    name: 'Royal Gold & Obsidian',
    desc: '24k metallic gold vs dark platinum',
    previewWhite: '#facc15',
    previewBlack: '#334155'
  },
  {
    id: 'geometric',
    name: 'Bauhaus Geometric',
    desc: 'Sleek modern architectural shapes',
    previewWhite: '#e2e8f0',
    previewBlack: '#0f172a'
  },
  {
    id: 'pixel',
    name: '8-Bit Arcade',
    desc: 'Retro pixel-art chess sprites',
    previewWhite: '#a7f3d0',
    previewBlack: '#6366f1'
  },
  {
    id: 'fantasy',
    name: 'Royal Kingdoms',
    desc: 'Crested medallions with kingdom emblems',
    previewWhite: '#fef3c7',
    previewBlack: '#312e81'
  },
  {
    id: 'custom',
    name: 'Custom Palette',
    desc: 'Pick your own team colors',
    previewWhite: '#38bdf8',
    previewBlack: '#fb7185'
  }
];

const FANTASY_ICONS = {
  K: { icon: '👑', title: 'King' },
  Q: { icon: '🦄', title: 'Queen' },
  R: { icon: '🏰', title: 'Rook' },
  B: { icon: '🧙', title: 'Bishop' },
  N: { icon: '🐉', title: 'Knight' },
  P: { icon: '🛡️', title: 'Pawn' },
  k: { icon: '👑', title: 'King' },
  q: { icon: '🔮', title: 'Queen' },
  r: { icon: '🏯', title: 'Rook' },
  b: { icon: '🧛', title: 'Bishop' },
  n: { icon: '🐺', title: 'Knight' },
  p: { icon: '⚔️', title: 'Pawn' }
};

export function ChessPiece({
  piece,
  skin = 'classic',
  customColors = null,
  className = 'w-full h-full select-none pointer-events-none'
}) {
  if (!piece) return null;

  const isWhite = piece >= 'A' && piece <= 'Z';
  const type = piece.toLowerCase();

  // 1. FANTASY MEDALLION SKIN
  if (skin === 'fantasy') {
    const info = FANTASY_ICONS[piece] || { icon: piece };
    const bgGrad = isWhite
      ? 'linear-gradient(135deg, #fffbeb 0%, #fde68a 55%, #f59e0b 100%)'
      : 'linear-gradient(135deg, #312e81 0%, #1e1b4b 60%, #090d16 100%)';
    const borderCol = isWhite ? '#b45309' : '#818cf8';
    const ringCol = isWhite ? 'rgba(255,255,255,0.8)' : 'rgba(129,140,248,0.4)';

    return (
      <div className={`${className} flex items-center justify-center p-0.5`}>
        <div
          className="w-full h-full rounded-full flex items-center justify-center relative shadow-md"
          style={{
            background: bgGrad,
            border: `2px solid ${borderCol}`,
            boxShadow: `inset 0 0 0 1.5px ${ringCol}, 0 3px 6px rgba(0,0,0,0.45)`
          }}
        >
          <span className="text-base sm:text-xl md:text-2xl leading-none filter drop-shadow">
            {info.icon}
          </span>
        </div>
      </div>
    );
  }

  // 2. BAUHAUS GEOMETRIC SKIN
  if (skin === 'geometric') {
    const fill = isWhite ? '#f8fafc' : '#1e293b';
    const stroke = isWhite ? '#0f172a' : '#38bdf8';
    const inner = isWhite ? '#0ea5e9' : '#f43f5e';

    return (
      <svg viewBox="0 0 45 45" className={className}>
        <g stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {type === 'p' && (
            <>
              <polygon points="22.5,11 33,36 12,36" fill={fill} />
              <circle cx="22.5" cy="11" r="4.5" fill={inner} />
            </>
          )}
          {type === 'r' && (
            <>
              <rect x="11" y="11" width="23" height="26" rx="2" fill={fill} />
              <rect x="16" y="16" width="13" height="16" fill={inner} opacity="0.85" />
              <line x1="11" y1="16" x2="34" y2="16" />
            </>
          )}
          {type === 'n' && (
            <>
              <polygon points="12,37 12,16 25,9 33,17 24,23 32,37" fill={fill} />
              <circle cx="21" cy="16" r="2.5" fill={inner} stroke="none" />
            </>
          )}
          {type === 'b' && (
            <>
              <polygon points="22.5,7 35,24 28,37 17,37 10,24" fill={fill} />
              <polygon points="22.5,14 29,24 22.5,32 16,24" fill={inner} stroke="none" />
            </>
          )}
          {type === 'q' && (
            <>
              <polygon points="8,15 16,26 22.5,10 29,26 37,15 33,37 12,37" fill={fill} />
              <circle cx="22.5" cy="28" r="4" fill={inner} stroke="none" />
              <circle cx="8" cy="13" r="2" fill={inner} />
              <circle cx="22.5" cy="8" r="2" fill={inner} />
              <circle cx="37" cy="13" r="2" fill={inner} />
            </>
          )}
          {type === 'k' && (
            <>
              <rect x="11" y="17" width="23" height="20" rx="3" fill={fill} />
              <polygon points="22.5,12 31,22 14,22" fill={inner} />
              <path d="M22.5 5v7M19 8.5h7" stroke={inner} strokeWidth="2.5" />
            </>
          )}
        </g>
      </svg>
    );
  }

  // 3. 8-BIT PIXEL ARCADE SKIN
  if (skin === 'pixel') {
    const main = isWhite ? '#ecfdf5' : '#312e81';
    const trim = isWhite ? '#10b981' : '#818cf8';
    const outline = isWhite ? '#064e3b' : '#e0e7ff';

    return (
      <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges">
        <g fill={main} stroke={outline} strokeWidth="0.6">
          {type === 'p' && (
            <>
              <rect x="6" y="3" width="4" height="4" />
              <rect x="5" y="7" width="6" height="2" fill={trim} />
              <rect x="6" y="9" width="4" height="3" />
              <rect x="4" y="12" width="8" height="2" />
            </>
          )}
          {type === 'r' && (
            <>
              <path d="M3,3 h2 v2 h2 v-2 h2 v2 h2 v-2 h2 v4 h-10 z" fill={trim} />
              <rect x="4" y="7" width="8" height="5" />
              <rect x="3" y="12" width="10" height="2" />
            </>
          )}
          {type === 'n' && (
            <>
              <path d="M5,3 h6 v2 h2 v3 h-3 v1 h2 v3 h-8 v-5 h1 z" />
              <rect x="6" y="4" width="2" height="2" fill={trim} stroke="none" />
              <rect x="3" y="12" width="10" height="2" />
            </>
          )}
          {type === 'b' && (
            <>
              <rect x="7" y="2" width="2" height="2" fill={trim} />
              <rect x="5" y="4" width="6" height="4" />
              <rect x="6" y="8" width="4" height="4" />
              <rect x="4" y="12" width="8" height="2" />
            </>
          )}
          {type === 'q' && (
            <>
              <rect x="3" y="3" width="2" height="2" fill={trim} />
              <rect x="7" y="2" width="2" height="2" fill={trim} />
              <rect x="11" y="3" width="2" height="2" fill={trim} />
              <path d="M3,5 h10 v4 h-2 v3 h-6 v-3 h-2 z" />
              <rect x="3" y="12" width="10" height="2" />
            </>
          )}
          {type === 'k' && (
            <>
              <rect x="7" y="1" width="2" height="4" fill={trim} />
              <rect x="6" y="2" width="4" height="2" fill={trim} />
              <rect x="4" y="5" width="8" height="4" />
              <rect x="5" y="9" width="6" height="3" />
              <rect x="3" y="12" width="10" height="2" />
            </>
          )}
        </g>
      </svg>
    );
  }

  // 4. STAUNTON-BASED SKINS: 'classic', 'cyber', 'royal', 'custom'
  let fill, stroke, accent, eyeColor;
  let glowFilter = undefined;

  if (skin === 'cyber') {
    fill = isWhite ? 'rgba(8, 51, 68, 0.88)' : 'rgba(59, 7, 100, 0.88)';
    stroke = isWhite ? '#22d3ee' : '#f472b6';
    accent = isWhite ? '#67e8f9' : '#f9a8d4';
    eyeColor = isWhite ? '#22d3ee' : '#f472b6';
    glowFilter = isWhite
      ? 'drop-shadow(0 0 4px rgba(34,211,238,0.75))'
      : 'drop-shadow(0 0 4px rgba(244,114,182,0.75))';
  } else if (skin === 'royal') {
    fill = isWhite ? 'url(#goldGrad)' : 'url(#obsidianGrad)';
    stroke = isWhite ? '#713f12' : '#0f172a';
    accent = isWhite ? '#fef08a' : '#94a3b8';
    eyeColor = isWhite ? '#dc2626' : '#38bdf8';
  } else if (skin === 'custom' && customColors) {
    fill = isWhite ? (customColors.whitePiece || '#38bdf8') : (customColors.blackPiece || '#fb7185');
    stroke = isWhite ? '#0f172a' : '#0f172a';
    accent = isWhite ? '#ffffff' : '#ffffff';
    eyeColor = accent;
  } else {
    // Classic
    fill = isWhite ? '#f8fafc' : '#1e293b';
    stroke = isWhite ? '#1e293b' : '#0f172a';
    accent = isWhite ? '#cbd5e1' : '#94a3b8';
    eyeColor = isWhite ? '#1e293b' : '#38bdf8';
  }

  const defs = skin === 'royal' ? (
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="45%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="obsidianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="50%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
  ) : null;

  switch (type) {
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className} style={{ filter: glowFilter }}>
          {defs}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22.5 11.63V6M20 8h5" stroke={isWhite ? stroke : accent} strokeWidth="1.5" />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill={fill}
              stroke={stroke}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23v.5C20 16 10.5 13 6.5 19.5c-3 6 6 10.5 6 10.5v7z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" stroke={accent} />
            <path d="M32 39.5c0 .83-.67 1.5-1.5 1.5h-16c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h16c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} style={{ filter: glowFilter }}>
          {defs}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="12" r="2" fill={fill} stroke={stroke} />
            <circle cx="14" cy="9" r="2" fill={fill} stroke={stroke} />
            <circle cx="22.5" cy="8" r="2" fill={fill} stroke={stroke} />
            <circle cx="31" cy="9" r="2" fill={fill} stroke={stroke} />
            <circle cx="39" cy="12" r="2" fill={fill} stroke={stroke} />
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.5-14-8 14-8-14-.5 14-7.5-11.5L9 26z"
              fill={fill}
              stroke={stroke}
              strokeLinecap="butt"
            />
            <path
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M11 38.5a35 35 1 0 0 23 0" stroke={accent} />
            <path d="M11 29a35 35 1 0 1 23 0" stroke={accent} />
            <path d="M32 40.5c0 .83-.67 1.5-1.5 1.5h-16c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h16c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} style={{ filter: glowFilter }}>
          {defs}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5l1.5-13.5h14l1.5 13.5H14zM11 14h23l1.5-5H31v3h-3.5V9h-5v3H19V9h-3.5v3H12V9L11 14z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17" stroke={accent} />
            <path d="M34 40.5c0 .83-.67 1.5-1.5 1.5h-20c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h20c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} style={{ filter: glowFilter }}>
          {defs}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="22.5" cy="8" r="1.5" fill={fill} stroke={stroke} />
            <path
              d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65-6.85-2-12-3.65-5.15-5.5-5.5-11.5-15.5C16.5 18.5 14.65 18.85 11 24c-3.65 5.15-2 12-2 12z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M17.5 26h10M15 30h15" stroke={accent} />
            <path d="M22.5 14.5v6M20 17.5h5" stroke={isWhite ? stroke : accent} />
            <path d="M31.5 39.5c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} style={{ filter: glowFilter }}>
          {defs}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M22 10c-3.5 1-6 4.5-5 8 1 3.5 2 4-1 6-3 2-5 5-5 9 0 3 2 4.5 4 4.5h15c2 0 3-1.5 3-4.5 0-4-3-6-3-9 0-3 1.5-5 1.5-8.5 0-3-2-5.5-4-5.5-1 0-2 .5-3 1.5-1-1.5-2-2-3.5-2-.5 0-1 .5-1.5 1-.5-.5-1-.5-1.5-.5z"
              fill={fill}
              stroke={stroke}
            />
            <path
              d="M24 18c.5-1.5 2-2 3.5-1.5M26 23c.5-1.5 2-2 3.5-1.5M16 26c1.5 1 3 1 4.5 0"
              stroke={isWhite ? stroke : accent}
            />
            <circle cx="17.5" cy="15.5" r="1.5" fill={eyeColor} />
            <path d="M31 39.5c0 .83-.67 1.5-1.5 1.5h-14c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h14c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className} style={{ filter: glowFilter }}>
          {defs}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="22.5" cy="12.5" r="4.5" fill={fill} stroke={stroke} />
            <path
              d="M19.5 18c-3 1.5-5 5.5-4 10.5 1 4.5 2.5 6 2.5 6.5h9c0-.5 1.5-2 2.5-6.5 1-5-1-9-4-10.5h-6z"
              fill={fill}
              stroke={stroke}
            />
            <path d="M16 33.5h13M17 28.5h11" stroke={accent} />
            <path d="M29 39.5c0 .83-.67 1.5-1.5 1.5h-10c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5h10c.83 0 1.5.67 1.5 1.5z" fill={fill} stroke={stroke} />
          </g>
        </svg>
      );

    default:
      return null;
  }
}
