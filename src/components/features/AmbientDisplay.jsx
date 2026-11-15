import { useState, useEffect, useCallback, useRef } from 'react';
import { usePhotos } from '../../hooks/usePhotos';
import { useDadJoke } from '../../hooks/useDadJoke';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Smile, 
  Clock, 
  Camera 
} from 'lucide-react';

const FALLBACK_JOKES = [
  "Why don't eggs tell jokes? They'd crack each other up.",
  "I'm afraid for the calendar. Its days are numbered.",
  "What do you call fake spaghetti? An impasta!",
  "Why did the scarecrow win an award? Because he was outstanding in his field.",
  "How does a penguin build its house? Igloos it together!",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "Why do seagulls fly over the ocean? Because if they flew over the bay, they'd be bagels!",
  "What do you call a factory that makes okay products? A satisfactory.",
  "Why can't a nose be 12 inches long? Because then it would be a foot!",
  "What did the ocean say to the shore? Nothing, it just waved!"
];

const JOKE_PALETTES = [
  {
    id: 'sunset',
    name: 'Sunset Amber',
    bg: 'from-amber-950 via-[#451a03] to-[#1c1917]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    quoteColor: 'text-amber-400/15',
    text: 'text-amber-100',
    subtext: 'text-amber-300/80',
    accentColor: '#f59e0b'
  },
  {
    id: 'cobalt',
    name: 'Cobalt Night',
    bg: 'from-indigo-950 via-[#1e1b4b] to-[#0f172a]',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    quoteColor: 'text-blue-400/15',
    text: 'text-blue-100',
    subtext: 'text-blue-300/80',
    accentColor: '#3b82f6'
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    bg: 'from-emerald-950 via-[#064e3b] to-[#022c22]',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    quoteColor: 'text-emerald-400/15',
    text: 'text-emerald-100',
    subtext: 'text-emerald-300/80',
    accentColor: '#10b981'
  },
  {
    id: 'berry',
    name: 'Berry Fuchsia',
    bg: 'from-purple-950 via-[#701a75] to-[#3b0764]',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    quoteColor: 'text-fuchsia-400/15',
    text: 'text-fuchsia-100',
    subtext: 'text-fuchsia-300/80',
    accentColor: '#d946ef'
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    bg: 'from-teal-950 via-[#134e4a] to-[#042f2e]',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    quoteColor: 'text-cyan-400/15',
    text: 'text-cyan-100',
    subtext: 'text-cyan-300/80',
    accentColor: '#06b6d4'
  },
  {
    id: 'crimson',
    name: 'Velvet Crimson',
    bg: 'from-rose-950 via-[#881337] to-[#4c0519]',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    quoteColor: 'text-rose-400/15',
    text: 'text-rose-100',
    subtext: 'text-rose-300/80',
    accentColor: '#f43f5e'
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    bg: 'from-violet-950 via-[#581c87] to-[#2e1065]',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    quoteColor: 'text-violet-400/15',
    text: 'text-violet-100',
    subtext: 'text-violet-300/80',
    accentColor: '#8b5cf6'
  },
  {
    id: 'slate',
    name: 'Cyber Noir',
    bg: 'from-slate-950 via-[#1e293b] to-black',
    badge: 'bg-slate-800 text-cyan-300 border-slate-700',
    quoteColor: 'text-slate-500/15',
    text: 'text-slate-100',
    subtext: 'text-slate-400',
    accentColor: '#22d3ee'
  }
];

export function AmbientDisplay({ className = '' }) {
  const { photos } = usePhotos();
  const { fetchJoke } = useDadJoke();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [particles, setParticles] = useState([]);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [currentJoke, setCurrentJoke] = useState("Loading Dad Joke of the Moment...");
  const [jokeKey, setJokeKey] = useState(1);
  const [activePhoto, setActivePhoto] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'photos' | 'jokes'
  const [isJokeChanging, setIsJokeChanging] = useState(false);

  const photoIndexRef = useRef(0);

  // Generate background particles once
  useEffect(() => {
    const p = Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      size: Math.random() * 12 + 4 + 'px',
      animationDuration: Math.random() * 22 + 14 + 's',
      animationDelay: Math.random() * -18 + 's',
      opacity: Math.random() * 0.35 + 0.1
    }));
    setParticles(p);
  }, []);

  // Update clock every minute
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timerId);
  }, []);

  // Cycle to a new Dad Joke and change the background color palette
  const cycleJoke = useCallback(async () => {
    setIsJokeChanging(true);
    try {
      const freshJoke = await fetchJoke();
      const text = freshJoke || FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
      setCurrentJoke(text);
      setPaletteIndex(prev => (prev + 1) % JOKE_PALETTES.length);
      setJokeKey(Date.now());
    } catch {
      const fallback = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
      setCurrentJoke(fallback);
      setPaletteIndex(prev => (prev + 1) % JOKE_PALETTES.length);
      setJokeKey(Date.now());
    } finally {
      setTimeout(() => setIsJokeChanging(false), 600);
    }
  }, [fetchJoke]);

  // Drop in the next photo on top of the joke background
  const cyclePhoto = useCallback(() => {
    if (!photos || photos.length === 0) {
      setActivePhoto(null);
      return;
    }

    if (photoIndexRef.current >= photos.length) {
      photoIndexRef.current = 0;
    }

    const nextPhotoData = photos[photoIndexRef.current];
    photoIndexRef.current = (photoIndexRef.current + 1) % photos.length;

    // Slight randomized rotation and offset for realistic scrapbook landing
    const startRotation = Math.floor(Math.random() * 16) - 8;
    const endRotation = Math.floor(Math.random() * 8) - 4;
    const xOffset = Math.floor(Math.random() * 30) - 15;

    setActivePhoto({
      key: `photo-${Date.now()}-${Math.random()}`,
      dataUrl: nextPhotoData.dataUrl,
      startRotation,
      endRotation,
      xOffset
    });
  }, [photos]);

  // Initial load
  useEffect(() => {
    cycleJoke();
  }, [cycleJoke]);

  // When photos load or change, drop the first photo
  useEffect(() => {
    if (photos && photos.length > 0 && !activePhoto) {
      cyclePhoto();
    }
  }, [photos, cyclePhoto, activePhoto]);

  // Automatic joke rotation timer (every 22 seconds)
  useEffect(() => {
    if (filterMode === 'photos') return;

    const interval = setInterval(() => {
      cycleJoke();
    }, 22000);

    return () => clearInterval(interval);
  }, [cycleJoke, filterMode]);

  // Automatic photo fall timer (every 11 seconds)
  useEffect(() => {
    if (filterMode === 'jokes') return;

    const interval = setInterval(() => {
      cyclePhoto();
    }, 11000);

    return () => clearInterval(interval);
  }, [cyclePhoto, filterMode]);

  const currentPalette = JOKE_PALETTES[paletteIndex] || JOKE_PALETTES[0];
  const formattedTime = currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div 
      className={`relative h-full w-full overflow-hidden flex flex-col bg-gradient-to-b ${currentPalette.bg} border-l border-slate-800/80 select-none transition-all duration-1000 ease-in-out ${className}`}
    >
      {/* Background Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              bottom: '-10%',
              animation: `drift-up ${p.animationDuration} linear infinite`,
              animationDelay: p.animationDelay,
              opacity: p.opacity
            }}
          />
        ))}
      </div>

      {/* Giant Ambient Watermark Quote Mark */}
      <div 
        className={`absolute -top-12 -left-6 text-[180px] md:text-[240px] font-serif font-black select-none pointer-events-none leading-none ${currentPalette.quoteColor} transition-colors duration-1000`}
      >
        “
      </div>

      {/* Top Ambient Header Bar */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-md border-b border-white/10 flex-none">
        <div className="flex items-center gap-2">
          {/* Animated color swatch of current palette */}
          <span 
            className="h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white/20 animate-pulse transition-colors duration-1000"
            style={{ backgroundColor: currentPalette.accentColor }}
          />
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Moments & Dad Jokes
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Filter */}
          <div className="flex bg-black/40 p-0.5 rounded border border-white/10 text-[10px] font-mono">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterMode === 'all' ? 'bg-white/25 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setFilterMode('jokes')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                filterMode === 'jokes' ? 'bg-white/25 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Jokes Only"
            >
              <Smile size={11} />
              Jokes
            </button>
            <button
              onClick={() => setFilterMode('photos')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                filterMode === 'photos' ? 'bg-white/25 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Photos Only"
            >
              <ImageIcon size={11} />
              Photos
            </button>
          </div>

          {/* Quick Cycle Joke Button */}
          <button
            onClick={() => cycleJoke()}
            disabled={isJokeChanging}
            className="flex items-center gap-1 px-2 py-1 bg-black/40 hover:bg-black/60 text-slate-200 hover:text-white rounded border border-white/10 text-xs font-mono transition-all active:scale-95 disabled:opacity-50"
            title="Next Dad Joke & New Background Color"
          >
            <Smile size={13} className="text-amber-400" />
            <span className="hidden sm:inline text-[10px] font-bold">New Joke</span>
          </button>

          {/* Quick Drop Photo Button */}
          {photos && photos.length > 0 && (
            <button
              onClick={() => cyclePhoto()}
              className="flex items-center gap-1 px-2 py-1 bg-black/40 hover:bg-black/60 text-slate-200 hover:text-white rounded border border-white/10 text-xs font-mono transition-all active:scale-95"
              title="Drop Next Family Photo"
            >
              <ImageIcon size={13} className="text-cyan-400" />
              <span className="hidden sm:inline text-[10px] font-bold">Next Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Stage: Dad Joke Canvas Background with Photos Falling On Top */}
      <div className="relative flex-1 w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-hidden">
        
        {/* UPPER/MIDDLE LAYER: The Dad Joke (The Big Background Feature) */}
        {filterMode !== 'photos' && (
          <div 
            key={jokeKey}
            className={`relative z-10 flex flex-col items-center justify-center text-center transition-all duration-700 animate-in fade-in slide-in-from-top-3 px-2 ${
              filterMode === 'jokes' || !activePhoto ? 'my-auto py-10' : 'pt-2 pb-4'
            }`}
          >
            {/* Protocol Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-[0.2em] font-black mb-3.5 backdrop-blur-sm ${currentPalette.badge} shadow-sm transition-colors duration-1000`}>
              <Smile size={12} />
              Dad Joke Protocol
            </div>

            {/* The Dad Joke Typography */}
            <p className={`font-black tracking-tight leading-snug drop-shadow-md max-w-xl mx-auto ${currentPalette.text} transition-colors duration-1000 ${
              filterMode === 'jokes' || !activePhoto 
                ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl' 
                : 'text-xl sm:text-2xl md:text-3xl'
            }`}>
              "{currentJoke}"
            </p>

            {/* Attribution */}
            <div className="mt-3 flex flex-col items-center">
              <div className={`text-xs font-mono font-bold uppercase tracking-widest ${currentPalette.subtext} transition-colors duration-1000`}>
                — Dad 🤓
              </div>
            </div>
          </div>
        )}

        {/* LOWER LAYER: Photo "Falling" On Top Of The Joke Canvas */}
        {filterMode !== 'jokes' && activePhoto && (
          <div className="relative z-20 flex-1 flex items-center justify-center min-h-[240px] pt-2 pointer-events-none">
            <div
              key={activePhoto.key}
              className="animate-photo-fall relative shadow-2xl rounded-sm bg-white p-3 pb-7 md:p-3.5 md:pb-8 max-w-[85%] sm:max-w-[70%] max-h-[44vh] flex flex-col items-center pointer-events-auto cursor-pointer"
              style={{
                '--rot-start': `${activePhoto.startRotation}deg`,
                '--rot-end': `${activePhoto.endRotation}deg`,
                transform: `translateX(${activePhoto.xOffset}px) rotate(${activePhoto.endRotation}deg)`
              }}
              onClick={() => cyclePhoto()}
              title="Click for next photo"
            >
              {/* Digital Washi Tape on top of the polaroid */}
              <div className="washi-tape" />

              {/* Photo View with subtle Ken Burns effect */}
              <div className="animate-ken-burns overflow-hidden rounded-xs bg-slate-100 max-h-[35vh] flex items-center justify-center">
                <img
                  src={activePhoto.dataUrl}
                  alt="Family Moment"
                  className="max-h-[33vh] w-auto max-w-full object-contain pointer-events-none drop-shadow"
                />
              </div>

              {/* Polaroid bottom caption */}
              <div className="mt-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Camera size={11} className="text-slate-400" />
                <span>Family Moments</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state hint if in photo mode but no photos */}
        {filterMode === 'photos' && (!photos || photos.length === 0) && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/60 font-mono text-xs uppercase tracking-widest">
            <Camera size={36} className="mb-3 text-white/40" />
            <span>No family photos uploaded yet</span>
            <span className="text-[10px] text-white/40 mt-1">Upload photos in the Memory Bank tab</span>
          </div>
        )}
      </div>

      {/* Bottom Ambient Bar: Time & Date */}
      <div className="relative z-30 px-4 py-2.5 bg-black/30 backdrop-blur-md border-t border-white/10 flex items-center justify-between text-xs font-mono flex-none">
        <div className="text-white/70 flex items-center gap-1.5 text-[11px] font-medium tracking-wide">
          <Clock size={12} className="text-cyan-400" />
          <span>{formattedDate}</span>
        </div>
        <div className="text-white font-black tracking-widest text-sm drop-shadow-sm">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
