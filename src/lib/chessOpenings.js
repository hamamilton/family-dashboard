/**
 * ECO Chess Openings, Defenses & Interactive Coach Library
 * Provides:
 * 1. Curated database of major Openings (White) and Defenses (Black) with ECO codes,
 *    strategic explanations, and move-by-move coaching notes.
 * 2. Real-time opening detection from the game's SAN move history.
 * 3. Next book move recommendations from the current position.
 * 4. Move quality classification (Book, Great, Good, Inaccuracy, Mistake, Blunder)
 *    with kid-friendly positional coaching tips.
 */

import { squareToName, squareToColRow } from './chessEngine';

export const CHESS_OPENINGS_DB = [
  // ==========================================================================
  // 1. e4 OPENINGS (WHITE) & DEFENSES (BLACK)
  // ==========================================================================
  {
    id: 'kings-pawn',
    eco: 'B00',
    name: "King's Pawn Opening",
    category: 'opening',
    side: 'w',
    featured: false,
    moves: ['e4'],
    summary: 'White immediately claims the center (d5 & f5) and opens diagonals for the Queen and King-side Bishop.',
    moveNotes: [
      '1. e4: Controls the center and frees your light-squared Bishop and Queen.'
    ]
  },
  {
    id: 'open-game',
    eco: 'C20',
    name: 'Open Game (King Pawn Symmetry)',
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['e4', 'e5'],
    summary: 'Black claims an equal share of the center and blocks White from advancing e4-e5.',
    moveNotes: [
      '1. e4: White stakes a claim in the center.',
      '1... e5: Black mirrors the center control and opens diagonals for both Bishop and Queen.'
    ]
  },
  {
    id: 'italian-game',
    eco: 'C50',
    name: 'Italian Game',
    category: 'opening',
    side: 'w',
    featured: true,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3'],
    summary: 'One of the oldest and best openings! White develops rapidly toward the center, aims at Black\'s weak f7 pawn, and prepares to castle early.',
    moveNotes: [
      '1. e4: Claim the center and open lines for your Bishop and Queen.',
      '1... e5: Black matches your center pawn.',
      '2. Nf3: Develop a Knight toward the center while attacking Black\'s e5 pawn ("Knights before Bishops!").',
      '2... Nc6: Black develops a Knight to defend the e5 pawn.',
      '3. Bc4: The Italian Bishop! Aims directly at f7 (Black\'s weakest square, defended only by the King) and clears the way to castle.',
      '3... Bc5: Black develops their Bishop to an active central diagonal.',
      '4. c3: Prepares to build an ideal pawn center with d4 or support d3.',
      '4... Nf6: Black develops the King-side Knight and attacks your e4 pawn.',
      '5. d3: Solidly defends e4 and opens the diagonal for your dark-squared Bishop!'
    ]
  },
  {
    id: 'two-knights-defense',
    eco: 'C55',
    name: 'Italian Game: Two Knights Defense',
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'],
    summary: 'Instead of developing the Bishop calmly, Black counter-attacks White\'s e4 pawn immediately with the Knight.',
    moveNotes: [
      '1. e4: White controls the center.',
      '1... e5: Black claims equal center space.',
      '2. Nf3: White attacks e5.',
      '2... Nc6: Black defends e5.',
      '3. Bc4: White targets f7.',
      '3... Nf6: Two Knights Defense! Black develops with tempo by counter-attacking White\'s e4 pawn.'
    ]
  },
  {
    id: 'fried-liver',
    eco: 'C57',
    name: 'Fried Liver / Knight Attack',
    category: 'opening',
    side: 'w',
    featured: true,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5'],
    summary: 'An aggressive tactical attack where White teams up the Knight and Bishop against Black\'s weak f7 square!',
    moveNotes: [
      '1. e4: Control the center.',
      '1... e5: Black mirrors.',
      '2. Nf3: Attack e5.',
      '2... Nc6: Defend e5.',
      '3. Bc4: Aim at f7.',
      '3... Nf6: Black counter-attacks e4.',
      '4. Ng5: Double attack on f7 with both Knight and Bishop!',
      '4... d5: The only way to block the Bishop\'s diagonal to f7!',
      '5. exd5: Capture the blocking pawn.',
      '5... Nxd5: Black recaptures, leading to sharp tactical play.'
    ]
  },
  {
    id: 'ruy-lopez',
    eco: 'C60',
    name: 'Ruy Lopez (Spanish Opening)',
    category: 'opening',
    side: 'w',
    featured: true,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O'],
    summary: 'Named after a 16th-century Spanish priest. White pressures the Knight that defends Black\'s e5 pawn and castles fast.',
    moveNotes: [
      '1. e4: Stake a claim in the center.',
      '1... e5: Black fights for the center.',
      '2. Nf3: Attack the e5 pawn.',
      '2... Nc6: Black defends e5 with the Knight.',
      '3. Bb5: The Ruy Lopez! Threatens to remove the Knight defending Black\'s e5 center pawn.',
      '3... a6: Morphy\'s Defense — "putting the question" to White\'s Bishop.',
      '4. Ba4: Retreat along the active diagonal so the pin threat remains alive.',
      '4... Nf6: Black develops and counter-attacks e4.',
      '5. O-O: Castle your King to safety and bring your Rook toward the e-file!'
    ]
  },
  {
    id: 'ruy-lopez-berlin',
    eco: 'C65',
    name: 'Ruy Lopez: Berlin Defense',
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'],
    summary: 'Known as the "Berlin Wall" — a rock-solid Grandmaster defense that immediately counter-attacks White\'s e4 pawn.',
    moveNotes: [
      '1. e4: Center control.',
      '1... e5: Equal center share.',
      '2. Nf3: Attacks e5.',
      '2... Nc6: Defends e5.',
      '3. Bb5: Pressures the c6 Knight.',
      '3... Nf6: Berlin Defense! Counter-attacks e4 and prepares to castle quickly.'
    ]
  },
  {
    id: 'scotch-game',
    eco: 'C45',
    name: 'Scotch Game',
    category: 'opening',
    side: 'w',
    featured: true,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4'],
    summary: 'White immediately blasts open the center on move 3 to give all pieces wide-open diagonals and files.',
    moveNotes: [
      '1. e4: Center pawn push.',
      '1... e5: Black mirrors.',
      '2. Nf3: Attack e5.',
      '2... Nc6: Defend e5.',
      '3. d4: The Scotch! Challenges Black\'s e5 pawn immediately to open the board.',
      '3... exd4: Black captures to release central tension.',
      '4. Nxd4: White centralizes the Knight on a powerful outpost!'
    ]
  },
  {
    id: 'four-knights',
    eco: 'C47',
    name: 'Four Knights Game',
    category: 'opening',
    side: 'w',
    featured: false,
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'],
    summary: 'Both players follow the golden rule "Knights before Bishops", developing all four Knights symmetrically.',
    moveNotes: [
      '1. e4: Center control.',
      '1... e5: Black mirrors.',
      '2. Nf3: First Knight out.',
      '2... Nc6: Black defends e5.',
      '3. Nc3: Second Knight out, protecting e4.',
      '3... Nf6: All four Knights are developed toward the center!'
    ]
  },
  {
    id: 'kings-gambit',
    eco: 'C30',
    name: "King's Gambit",
    category: 'opening',
    side: 'w',
    featured: false,
    moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3'],
    summary: 'A swashbuckling Romantic-era gambit! White offers the f-pawn to deflect Black\'s center pawn and open the f-file for attack.',
    moveNotes: [
      '1. e4: Claim the center.',
      '1... e5: Black replies symmetrically.',
      '2. f4: The King\'s Gambit! Offering a wing pawn to destroy Black\'s center.',
      '2... exf4: Black accepts the gambit.',
      '3. Nf3: Prevents Black\'s Queen from checking on h4 and prepares d4.'
    ]
  },
  {
    id: 'scholars-mate-defense',
    eco: 'C20',
    name: "Defending Scholar's Mate (Wayward Queen)",
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'g6', 'Qf3', 'Nf6'],
    summary: 'Essential lesson! Learn how to easily shut down the 4-move Scholar\'s Mate trap and punish White for bringing the Queen out too early.',
    moveNotes: [
      '1. e4: White starts normally.',
      '1... e5: Grab your share of the center.',
      '2. Qh5: Watch out! White brings the Queen out early, attacking BOTH your e5 pawn and f7!',
      '2... Nc6: Crucial move #1! Defend your e5 pawn FIRST before chasing the Queen.',
      '3. Bc4: White aims the Bishop + Queen battery at f7, threatening checkmate in 1 move (Qxf7#)!',
      '3... g6: Crucial move #2! Block the Queen\'s path to f7 while attacking the Queen.',
      '4. Qf3: White tries one more time! Lining the Queen up on f3 to threaten Qxf7# again.',
      '4... Nf6: Crucial move #3! Develop your Knight to block the f-file. Now Scholar\'s Mate is completely stopped and you are ahead in development!'
    ]
  },
  {
    id: 'petrov-defense',
    eco: 'C42',
    name: "Petrov's Defense (Russian Game)",
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['e4', 'e5', 'Nf3', 'Nf6'],
    summary: 'Instead of defending e5 passively, Black counter-attacks White\'s e4 pawn right back.',
    moveNotes: [
      '1. e4: White claims the center.',
      '1... e5: Black matches.',
      '2. Nf3: White attacks e5.',
      '2... Nf6: Petrov\'s Defense! Counter-attacks White\'s e4 pawn immediately.'
    ]
  },

  // ==========================================================================
  // SEMI-OPEN DEFENSES AGAINST 1. e4 (BLACK DEFENSES)
  // ==========================================================================
  {
    id: 'sicilian-defense',
    eco: 'B20',
    name: 'Sicilian Defense',
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3'],
    summary: 'The most popular and high-scoring defense against 1. e4! Black fights for the d4 center square asymmetrically and opens the c-file for counter-attack.',
    moveNotes: [
      '1. e4: White controls the center.',
      '1... c5: The Sicilian Defense! Fights for d4 from the wing without mirroring White.',
      '2. Nf3: White develops the Knight and prepares d4.',
      '2... d6: Controls e5 and opens the diagonal for the light-squared Bishop.',
      '3. d4: White opens the center.',
      '3... cxd4: Trade your flank c-pawn for White\'s central d-pawn! Now Black has two center pawns (d & e) vs White\'s one (e).',
      '4. Nxd4: White recaptures with the Knight.',
      '4... Nf6: Develop your Knight and attack White\'s e4 pawn!',
      '5. Nc3: White defends e4, setting up the classic Open Sicilian.'
    ]
  },
  {
    id: 'sicilian-alapin',
    eco: 'B22',
    name: 'Sicilian Defense: Alapin Variation',
    category: 'opening',
    side: 'w',
    featured: false,
    moves: ['e4', 'c5', 'c3', 'Nf6', 'e5', 'Nd5', 'd4'],
    summary: 'A smart, easy-to-learn system against the Sicilian where White plays c3 to build a full e4+d4 pawn center.',
    moveNotes: [
      '1. e4: Center push.',
      '1... c5: Sicilian Defense.',
      '2. c3: Prepares to push d4 with pawn support!',
      '2... Nf6: Black attacks e4.',
      '3. e5: Chase the Knight away.',
      '3... Nd5: Black centralizes the Knight.',
      '4. d4: White claims the entire center!'
    ]
  },
  {
    id: 'french-defense',
    eco: 'C00',
    name: 'French Defense',
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7'],
    summary: 'A resilient, strategic defense! Black plays e6 to prepare a supported d5 strike against White\'s center.',
    moveNotes: [
      '1. e4: White claims the center.',
      '1... e6: The French Defense! Prepares to push d5 on the next move with pawn support.',
      '2. d4: White builds an ideal two-pawn center.',
      '2... d5: Strike directly at White\'s e4 pawn!',
      '3. Nc3: White defends e4.',
      '3... Nf6: Add pressure to e4 and d5.',
      '4. e5: White pushes forward to gain space and attack your Knight.',
      '4... Nfd7: Retreat the Knight to d7, ready to counter-attack the base of White\'s pawn chain with ...c5!'
    ]
  },
  {
    id: 'caro-kann',
    eco: 'B10',
    name: 'Caro-Kann Defense',
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
    summary: 'Famous for extreme solidity! Black supports the d5 pawn strike with c6 while keeping the light-squared Bishop\'s diagonal open.',
    moveNotes: [
      '1. e4: White occupies the center.',
      '1... c6: The Caro-Kann! Prepares ...d5 while keeping the e6 square clear for your light-squared Bishop.',
      '2. d4: White claims the center.',
      '2... d5: Challenge White\'s e4 pawn immediately.',
      '3. Nc3: White defends e4.',
      '3... dxe4: Eliminate White\'s e4 pawn to open the center.',
      '4. Nxe4: White recaptures.',
      '4... Bf5: Develop your light-squared Bishop outside the pawn chain while attacking White\'s Knight!'
    ]
  },
  {
    id: 'scandinavian-defense',
    eco: 'B01',
    name: 'Scandinavian Defense (Center Counter)',
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5'],
    summary: 'Direct and easy to learn! Black challenges White\'s e4 pawn on move 1 and places the Queen on a safe, active square on a5.',
    moveNotes: [
      '1. e4: White takes the center.',
      '1... d5: The Scandinavian! Immediately challenges White\'s e4 pawn on move 1.',
      '2. exd5: White captures.',
      '2... Qxd5: Recapture with the Queen in the center.',
      '3. Nc3: White develops with tempo by attacking your Queen.',
      '3... Qa5: The classical safe haven! The Queen pressures White\'s queenside and prepares ...c6 and ...Bf5.'
    ]
  },
  {
    id: 'pirc-defense',
    eco: 'B07',
    name: 'Pirc Defense',
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Nf3', 'Bg7'],
    summary: 'A hypermodern defense: Black lets White build a center first, then attacks it from the flanks with a fianchettoed Bishop on g7.',
    moveNotes: [
      '1. e4: White takes center space.',
      '1... d6: Controls e5.',
      '2. d4: White builds a big center.',
      '2... Nf6: Attacks e4 immediately.',
      '3. Nc3: White defends e4.',
      '3... g6: Prepares to fianchetto the dark-squared Bishop to g7.',
      '4. Nf3: White develops.',
      '4... Bg7: The Pirc Dragon Bishop! Lasers across the long diagonal.'
    ]
  },

  // ==========================================================================
  // 1. d4 OPENINGS (WHITE) & DEFENSES (BLACK)
  // ==========================================================================
  {
    id: 'queens-pawn',
    eco: 'D00',
    name: "Queen's Pawn Opening",
    category: 'opening',
    side: 'w',
    featured: false,
    moves: ['d4'],
    summary: 'White claims the center with a protected pawn (already defended by the Queen on d1!).',
    moveNotes: [
      '1. d4: Controls c5 and e5 while keeping the pawn protected by your Queen.'
    ]
  },
  {
    id: 'queens-gambit',
    eco: 'D06',
    name: "Queen's Gambit",
    category: 'opening',
    side: 'w',
    featured: true,
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3'],
    summary: 'The most famous strategic opening in chess! White offers the c4 pawn to pull Black\'s d5 pawn away from the center.',
    moveNotes: [
      '1. d4: Occupy the center with a Queen-protected pawn.',
      '1... d5: Black claims equal center space.',
      '2. c4: The Queen\'s Gambit! Attacks d5 from the flank (it\'s a "safe" gambit because White can easily win the pawn back if Black takes).',
      '2... e6: Queen\'s Gambit Declined — Black solidly supports d5 with a pawn.',
      '3. Nc3: Add more pressure to Black\'s d5 center pawn!',
      '3... Nf6: Black develops and reinforces d5.',
      '4. Bg5: Pin Black\'s Knight to the Queen to weaken d5\'s defense!',
      '4... Be7: Black breaks the pin and prepares to castle.',
      '5. e3: Solidifies d4 and opens the diagonal for your light-squared Bishop!'
    ]
  },
  {
    id: 'queens-gambit-accepted',
    eco: 'D20',
    name: "Queen's Gambit Accepted",
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['d4', 'd5', 'c4', 'dxc4', 'Nf3', 'Nf6', 'e3'],
    summary: 'Black accepts the c4 pawn temporarily to allow free and easy piece development before counter-attacking.',
    moveNotes: [
      '1. d4: Center pawn.',
      '1... d5: Black matches.',
      '2. c4: Queen\'s Gambit.',
      '2... dxc4: Black takes the pawn to open lines (don\'t try to hold onto c4 forever; focus on developing!).',
      '3. Nf3: Prevents Black from playing ...e5.',
      '3... Nf6: Develop the Knight.',
      '4. e3: White prepares Bxc4 to regain the pawn with an active Bishop.'
    ]
  },
  {
    id: 'slav-defense',
    eco: 'D10',
    name: 'Slav Defense',
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'Bf5'],
    summary: 'A top-tier defense to the Queen\'s Gambit! Black supports d5 with c6 so the light-squared Bishop isn\'t locked behind e6.',
    moveNotes: [
      '1. d4: White controls the center.',
      '1... d5: Black claims equal center space.',
      '2. c4: White plays the Queen\'s Gambit.',
      '2... c6: The Slav Defense! Supports d5 with a pawn while leaving the c8-h3 diagonal open for your Bishop.',
      '3. Nf3: White develops.',
      '3... Nf6: Develop your King-side Knight.',
      '4. Nc3: White develops the second Knight.',
      '4... Bf5: Bring your light-squared Bishop outside the pawn chain before playing ...e6!'
    ]
  },
  {
    id: 'london-system',
    eco: 'D02',
    name: 'London System',
    category: 'opening',
    side: 'w',
    featured: true,
    moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'c5', 'c3', 'Nc6', 'Nd2'],
    summary: 'A super reliable, universal system for White! You build an unbreakable pyramid of pawns (c3-d4-e3) after developing your dark-squared Bishop to f4.',
    moveNotes: [
      '1. d4: Control the center.',
      '1... d5: Black matches.',
      '2. Bf4: The signature London move! Bring your dark-squared Bishop out BEFORE playing e3 so it isn\'t trapped.',
      '2... Nf6: Black develops.',
      '3. e3: Lock in the solid e3-d4 chain and open the diagonal for your light-squared Bishop.',
      '3... c5: Black attacks your d4 center.',
      '4. c3: Complete the famous "London Pyramid" (c3-d4-e3) — rock solid!',
      '4... Nc6: Black develops.',
      '5. Nd2: Develop the Knight to d2 so it doesn\'t block your c3 pawn and supports e4.'
    ]
  },
  {
    id: 'kings-indian-defense',
    eco: 'E60',
    name: "King's Indian Defense",
    category: 'defense',
    side: 'b',
    featured: true,
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'],
    summary: 'A dynamic, counter-attacking favorite of World Champions Garry Kasparov and Bobby Fischer! Black castles early and strikes back at White\'s center.',
    moveNotes: [
      '1. d4: White takes the center.',
      '1... Nf6: Develop your Knight and prevent White from playing e4 immediately.',
      '2. c4: White expands.',
      '2... g6: Prepare to fianchetto your dark-squared Bishop to g7.',
      '3. Nc3: White prepares e4.',
      '3... Bg7: The King\'s Indian Bishop! Controls the dark squares all the way to a1.',
      '4. e4: White builds a three-pawn center.',
      '4... d6: Stops White from pushing e5 and prepares a future ...e5 or ...c5 counter-strike!',
      '5. Nf3: White develops.',
      '5... O-O: Castle your King to safety — now you are ready to strike the center!'
    ]
  },
  {
    id: 'nimzo-indian',
    eco: 'E20',
    name: 'Nimzo-Indian Defense',
    category: 'defense',
    side: 'b',
    featured: false,
    moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'],
    summary: 'Black pins White\'s c3 Knight with the Bishop to prevent White from playing e4.',
    moveNotes: [
      '1. d4: Center control.',
      '1... Nf6: Controls e4.',
      '2. c4: White expands.',
      '2... e6: Opens the diagonal for the dark-squared Bishop.',
      '3. Nc3: White threatens e4.',
      '3... Bb4: The Nimzo-Indian pin! Neutralizes the Knight that wanted to support e4.'
    ]
  },
  {
    id: 'english-opening',
    eco: 'A10',
    name: 'English Opening',
    category: 'opening',
    side: 'w',
    featured: false,
    moves: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6'],
    summary: 'A flexible flank opening where White fights for the d5 center square from c4 (like a reversed Sicilian with an extra move!).',
    moveNotes: [
      '1. c4: Controls the d5 center square from the flank.',
      '1... e5: Black claims central space.',
      '2. Nc3: Doubles down on d5 control.',
      '2... Nf6: Black develops.',
      '3. Nf3: Attacks e5.',
      '3... Nc6: Reaches the Four Knights English.'
    ]
  }
];

// Clean SAN string (strip check/mate symbols for matching)
function normalizeSan(san) {
  return (san || '').replace(/[+#?!]/g, '').trim();
}

/**
 * Given the game's history array (each item has .san) and current engine,
 * detect the most specific opening/defense and return coaching insights + next book moves.
 */
export function detectOpeningAndCoach(history = [], engine = null) {
  const playedSans = history.map(h => normalizeSan(h.san));

  if (playedSans.length === 0) {
    return {
      opening: null,
      coachNote: 'Opening Principle: Start by controlling the center with a central pawn (1. e4 or 1. d4) to free your Bishops and Queen!',
      nextBookMoves: getNextBookMoves([], engine)
    };
  }

  let bestMatch = null;
  let bestMatchLength = 0;

  for (const entry of CHESS_OPENINGS_DB) {
    const entryLen = entry.moves.length;
    // Check how many moves match from the start
    const compareLen = Math.min(playedSans.length, entryLen);
    let allMatch = true;
    for (let i = 0; i < compareLen; i++) {
      if (normalizeSan(entry.moves[i]) !== playedSans[i]) {
        allMatch = false;
        break;
      }
    }

    // Full match of an opening entry up to its length
    if (allMatch && playedSans.length >= entryLen && entryLen > bestMatchLength) {
      bestMatch = entry;
      bestMatchLength = entryLen;
    } else if (allMatch && playedSans.length < entryLen && compareLen > bestMatchLength) {
      // Partial prefix match of a deeper line if no exact longer match yet
      bestMatch = entry;
      bestMatchLength = compareLen;
    }
  }

  const nextBookMoves = getNextBookMoves(playedSans, engine);

  // Determine step-specific note if we are currently inside the matched opening's moveNotes
  let stepNote = null;
  if (bestMatch) {
    const plyIdx = playedSans.length - 1;
    if (plyIdx >= 0 && plyIdx < (bestMatch.moveNotes?.length || 0)) {
      const expectedAtPly = normalizeSan(bestMatch.moves[plyIdx]);
      if (expectedAtPly === playedSans[plyIdx]) {
        stepNote = bestMatch.moveNotes[plyIdx];
      }
    }
  }

  return {
    opening: bestMatch,
    stepNote,
    coachNote: stepNote || bestMatch?.summary || getGeneralPhaseTip(history.length),
    nextBookMoves
  };
}

/**
 * Find all distinct book continuations from the current move sequence.
 */
export function getNextBookMoves(playedSans = [], engine = null) {
  const ply = playedSans.length;
  const continuations = new Map();

  for (const entry of CHESS_OPENINGS_DB) {
    if (entry.moves.length <= ply) continue;
    let matchesPrefix = true;
    for (let i = 0; i < ply; i++) {
      if (normalizeSan(entry.moves[i]) !== playedSans[i]) {
        matchesPrefix = false;
        break;
      }
    }
    if (!matchesPrefix) continue;

    const nextSan = entry.moves[ply];
    const cleanNext = normalizeSan(nextSan);
    if (!continuations.has(cleanNext)) {
      let moveCoords = null;
      if (engine) {
        const legal = engine.getLegalMoves();
        const found = legal.find(m => normalizeSan(engine.moveToSan(m, legal)) === cleanNext);
        if (found) {
          moveCoords = { from: found.from, to: found.to, uci: engine.moveToUci(found) };
        }
      }
      continuations.set(cleanNext, {
        san: nextSan,
        openingName: entry.name,
        eco: entry.eco,
        note: entry.moveNotes?.[ply] || entry.summary,
        coords: moveCoords
      });
    }
  }

  return Array.from(continuations.values());
}

function getGeneralPhaseTip(plyCount) {
  if (plyCount < 10) {
    return 'Opening Principle: Develop your Knights and Bishops toward the center, don\'t move the same piece twice, and castle your King early!';
  }
  if (plyCount < 28) {
    return 'Middlegame Tip: Connect your Rooks on the back rank, place Rooks on open files, and look for tactical forks, pins, and skewers!';
  }
  return 'Endgame Tip: Activate your King toward the center and push passed pawns toward promotion!';
}

/**
 * Evaluate the quality of a played move and generate a short educational tip.
 */
export function analyzePlayedMove(record, isBookMove, evalBeforeCp, evalAfterCp) {
  const pieceType = (record.piece || '').toUpperCase();
  const { col: toCol, row: toRow } = squareToColRow(record.to);
  const toSqName = squareToName(record.to);

  // Determine tactical/positional observation
  let coachTip = '';
  if (record.san?.includes('#')) {
    coachTip = 'Checkmate! The opponent\'s King is in check with no legal escape.';
  } else if (record.isCastle) {
    coachTip = 'Great principle! Castling tucks your King into safety and activates your Rook.';
  } else if (record.promotion) {
    coachTip = 'Pawn promotion! Advancing a passed pawn all the way transforms it into a powerhouse.';
  } else if (record.san?.includes('+')) {
    coachTip = 'Check! Forces the opponent to respond to the threat on their King immediately.';
  } else if (record.captured) {
    coachTip = `Captured on ${toSqName}, winning material or trading active pieces.`;
  } else if ((pieceType === 'N' || pieceType === 'B') && record.fenBefore?.includes(' 1 ') || (pieceType === 'N' || pieceType === 'B')) {
    coachTip = `Developed ${pieceType === 'N' ? 'Knight' : 'Bishop'} to ${toSqName} to control key squares.`;
  } else if (pieceType === 'P' && (toCol === 3 || toCol === 4) && (toRow === 3 || toRow === 4)) {
    coachTip = `Central pawn push to ${toSqName} — fighting for control of the center!`;
  } else {
    coachTip = `Moved to ${toSqName} to improve piece coordination.`;
  }

  if (isBookMove) {
    return {
      badge: '📖 Book',
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      tip: `Book Move! ${coachTip}`
    };
  }

  if (record.san?.includes('#')) {
    return {
      badge: '👑 Mate',
      color: 'text-amber-300 bg-amber-500/20 border-amber-400/50',
      tip: coachTip
    };
  }

  if (evalBeforeCp === null || evalAfterCp === null) {
    return {
      badge: '✓ Good',
      color: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
      tip: coachTip
    };
  }

  // Cp loss from mover's perspective
  const isWhiteMover = record.piece >= 'A' && record.piece <= 'Z';
  const cpDelta = isWhiteMover ? (evalAfterCp - evalBeforeCp) : (evalBeforeCp - evalAfterCp);

  if (cpDelta >= -15) {
    return {
      badge: '⭐ Great',
      color: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
      tip: coachTip
    };
  }
  if (cpDelta >= -65) {
    return {
      badge: '✓ Solid',
      color: 'text-slate-300 bg-slate-800 border-slate-700',
      tip: coachTip
    };
  }
  if (cpDelta >= -150) {
    return {
      badge: '?! Inaccuracy',
      color: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
      tip: 'Slight inaccuracy — look for a move that develops a piece or defends a central square.'
    };
  }
  if (cpDelta >= -280) {
    return {
      badge: '? Mistake',
      color: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
      tip: 'Careful! That move lost positional or material advantage. Use Undo to try another move!'
    };
  }
  return {
    badge: '?? Blunder',
    color: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
    tip: 'Blunder alert! Check if a piece was left undefended. Hit Undo to try a safer move!'
  };
}
