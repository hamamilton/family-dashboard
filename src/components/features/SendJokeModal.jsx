import { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, 
  Copy, 
  Check, 
  MessageSquare, 
  Pencil, 
  X, 
  ExternalLink, 
  Sparkles, 
  Smile, 
  RefreshCw,
  Radio,
  Info
} from 'lucide-react';
import { useDadJoke } from '../../hooks/useDadJoke';
import { formatPhoneDisplay } from '../../lib/carriers';
import { isAppleDevice } from '../../lib/device';

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

export function SendJokeModal({ isOpen, onClose, profiles: propProfiles = [], initialJoke = '' }) {
  const { fetchJoke } = useDadJoke();

  const [activeJoke, setActiveJoke] = useState(initialJoke || '');
  const [loadingJoke, setLoadingJoke] = useState(false);
  const [profiles, setProfiles] = useState(propProfiles);
  const [copiedJoke, setCopiedJoke] = useState(false);
  const [transmitToast, setTransmitToast] = useState(null);
  const isApple = isAppleDevice();
  
  // Profile editing state
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingProfileId, setSavingProfileId] = useState(null);

  // Sync propProfiles with internal state
  useEffect(() => {
    if (propProfiles && propProfiles.length > 0) {
      setProfiles(propProfiles);
    }
  }, [propProfiles]);

  // Fallback direct load of profiles from DB if empty
  const refreshProfiles = useCallback(async () => {
    try {
      const res = await fetch('https://hamilton-family-db.fly.dev/api/collections/profiles/records?perPage=50');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.items || []);
      }
    } catch (e) {
      console.error('Failed to refresh profiles in SendJokeModal', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen && (!profiles || profiles.length === 0)) {
      refreshProfiles();
    }
  }, [isOpen, profiles, refreshProfiles]);

  // Fetch or set active joke when modal opens
  const loadJoke = useCallback(async () => {
    setLoadingJoke(true);
    try {
      const fresh = await fetchJoke();
      setActiveJoke(fresh || FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)]);
    } catch {
      setActiveJoke(FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)]);
    } finally {
      setLoadingJoke(false);
    }
  }, [fetchJoke]);

  useEffect(() => {
    if (isOpen) {
      setTransmitToast(null);
      if (initialJoke) {
        setActiveJoke(initialJoke);
      } else if (!activeJoke) {
        loadJoke();
      }
    }
  }, [isOpen, initialJoke, loadJoke, activeJoke]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentJokeText = activeJoke || "Why did the scarecrow win an award? Because he was outstanding in his field.";
  const formattedJokeText = `Dad Joke of the Day:\n"${currentJokeText}"\n— Dad 🤓`;

  // Copy joke to clipboard
  const handleCopyJoke = async () => {
    try {
      await navigator.clipboard.writeText(formattedJokeText);
      setCopiedJoke(true);
      setTimeout(() => setCopiedJoke(false), 2500);
    } catch (err) {
      console.error('Failed to copy joke', err);
    }
  };

  // Start inline editing
  const startEditing = (person) => {
    setEditingProfileId(person.id);
    setPhoneInput(person.phone || '');
  };

  // Save phone number inline
  const handleSaveProfileInline = async (profileId) => {
    setSavingProfileId(profileId);
    try {
      const res = await fetch(`https://hamilton-family-db.fly.dev/api/collections/profiles/records/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneInput.trim()
        })
      });
      if (res.ok) {
        setProfiles(prev => prev.map(p => p.id === profileId ? { 
          ...p, 
          phone: phoneInput.trim()
        } : p));
        setEditingProfileId(null);
      }
    } catch (err) {
      console.error('Failed to save profile phone', err);
    } finally {
      setSavingProfileId(null);
    }
  };

  // Broadcast to Arthur & Ben via iMessage (Apple devices only)
  const handleBroadcastBoys = async () => {
    if (!isApple) {
      setTransmitToast({
        type: 'info',
        message: 'iMessage is disabled on non-Apple products. You can copy the joke to your clipboard instead!'
      });
      handleCopyJoke();
      return;
    }

    const boys = profiles.filter(p => {
      const name = (p.name || '').toLowerCase();
      return (name === 'arthur' || name === 'ben') && p.phone;
    });

    if (boys.length === 0) {
      setTransmitToast({
        type: 'info',
        message: 'Arthur and Ben need phone numbers configured to send iMessage.'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(formattedJokeText);
    } catch (e) {
      console.warn('Clipboard write warning', e);
    }

    const numbers = boys.map(p => {
      const d = String(p.phone || '').replace(/\D/g, '');
      return d.length === 10 ? '+1' + d : '+' + d;
    }).join(',');

    const smsUrl = `sms:${numbers}?&body=${encodeURIComponent(formattedJokeText)}`;
    window.location.href = smsUrl;

    setTransmitToast({
      type: 'imessage',
      message: `Opening iMessage group text for Arthur & Ben! Joke text is pre-filled.`,
      details: `The joke was also copied to your clipboard as a backup.`
    });
  };

  // Send via Google Voice (Fallback)
  const handleSendGoogleVoice = async (person) => {
    const digits = String(person.phone || '').replace(/\D/g, '');
    const cleanNumber = digits.length === 10 ? '1' + digits : digits;
    if (!cleanNumber) {
      startEditing(person);
      return;
    }

    try {
      await navigator.clipboard.writeText(formattedJokeText);
    } catch (e) {
      console.warn('Clipboard write warning', e);
    }

    const gvUrl = `https://voice.google.com/u/0/messages?itemId=t.%2B${cleanNumber}`;
    window.open(gvUrl, '_blank', 'noopener,noreferrer');

    setTransmitToast({
      type: 'gv',
      message: `Joke copied! Opening Google Voice thread with ${person.name}... Press ⌘V / Paste & Send!`
    });
  };

  // Send via native iMessage (Apple products only)
  const handleSendIMessage = async (person) => {
    if (!isApple) {
      setTransmitToast({
        type: 'info',
        message: `iMessage is disabled on non-Apple products. The joke was copied to your clipboard!`
      });
      handleCopyJoke();
      return;
    }

    const digits = String(person.phone || '').replace(/\D/g, '');
    const cleanNumber = digits.length === 10 ? '1' + digits : digits;
    if (!cleanNumber) {
      startEditing(person);
      return;
    }

    try {
      await navigator.clipboard.writeText(formattedJokeText);
    } catch (e) {
      console.warn('Clipboard write warning', e);
    }

    const smsUrl = `sms:+${cleanNumber}?&body=${encodeURIComponent(formattedJokeText)}`;
    window.location.href = smsUrl;

    setTransmitToast({
      type: 'imessage',
      message: `Opening iMessage for ${person.name}! Joke text is pre-filled.`,
      details: `The joke was also copied to your clipboard as a backup.`
    });
  };

  // Sort profiles: Arthur and Ben first!
  const sortedProfiles = [...profiles].sort((a, b) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    const aIsPriority = aName === 'arthur' || aName === 'ben';
    const bIsPriority = bName === 'arthur' || bName === 'ben';
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return aName.localeCompare(bName);
  });

  // Check if Arthur or Ben are ready for 1-tap iMessage
  const arthurOrBenReady = sortedProfiles.some(p => {
    const n = (p.name || '').toLowerCase();
    return (n === 'arthur' || n === 'ben') && p.phone;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col font-mono animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                Transmit Dad Joke
                {isApple ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold flex items-center gap-1">
                    💬 iMessage Ready
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold flex items-center gap-1" title="iMessage only works on Apple devices">
                    🚫 Non-Apple Device
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isApple 
                  ? "Direct iMessage dispatch to Arthur, Ben, or family phones" 
                  : "iMessage is disabled on non-Apple products (use Copy Joke below)"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 max-h-[calc(92vh-140px)]">
          
          {/* Feedback & Status Alert Banner */}
          {transmitToast && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-lg animate-in fade-in duration-200 ${
              transmitToast.type === 'imessage'
                ? 'bg-sky-950/80 border-sky-500/50 text-sky-100'
                : transmitToast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
                : transmitToast.type === 'smtp_needed'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-100'
                : transmitToast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-100'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-100'
            }`}>
              <div className={`p-1 rounded mt-0.5 shrink-0 ${
                transmitToast.type === 'imessage'
                  ? 'bg-sky-500/20 text-sky-300'
                  : transmitToast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : transmitToast.type === 'smtp_needed'
                  ? 'bg-amber-500/20 text-amber-300'
                  : transmitToast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {transmitToast.type === 'imessage' && <MessageSquare size={14} />}
                {transmitToast.type === 'success' && <Check size={14} />}
                {transmitToast.type === 'smtp_needed' && <AlertTriangle size={14} />}
                {transmitToast.type === 'error' && <X size={14} />}
                {transmitToast.type === 'gv' && <ExternalLink size={14} />}
                {transmitToast.type === 'info' && <Info size={14} />}
              </div>
              <div className="text-xs space-y-1 flex-1">
                <p className="font-bold">{transmitToast.message}</p>
                {transmitToast.details && (
                  <p className="text-[11px] opacity-90 font-sans leading-relaxed">
                    {transmitToast.details}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Joke Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Smile size={12} className="text-amber-400" />
                Current Dad Joke
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={loadJoke}
                  disabled={loadingJoke}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 transition-colors disabled:opacity-50 text-[10px]"
                  title="Cycle to another Dad Joke"
                >
                  <RefreshCw size={10} className={loadingJoke ? "animate-spin" : ""} />
                  <span>Cycle Joke</span>
                </button>
                <button
                  onClick={handleCopyJoke}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                >
                  {copiedJoke ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copiedJoke ? 'Copied ✓' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <p className="text-sm font-sans font-medium text-slate-200 italic leading-relaxed">
              "{currentJokeText}"
            </p>
            <span className="text-[10px] text-amber-400 font-bold self-end">— Dad 🤓</span>
          </div>

          {/* Quick Broadcast to Arthur & Ben Button */}
          {arthurOrBenReady && (
            <button
              onClick={handleBroadcastBoys}
              disabled={!isApple}
              className={`w-full py-2.5 px-4 rounded-xl border font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                isApple
                  ? 'bg-gradient-to-r from-sky-600/30 via-blue-600/30 to-indigo-600/30 hover:from-sky-600/45 hover:via-blue-600/45 hover:to-indigo-600/45 border-sky-500/50 text-white active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title={isApple ? "Open iMessage for Arthur & Ben" : "iMessage is only available on Apple devices (iPhone, iPad, Mac)"}
            >
              <MessageSquare size={14} className={isApple ? "text-sky-400" : "text-slate-500"} />
              <span>
                {isApple 
                  ? "💬 Send iMessage to Arthur & Ben" 
                  : "💬 iMessage to Arthur & Ben (Apple Only — Disabled)"}
              </span>
            </button>
          )}

          {/* Recipient Selection Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Radio size={12} className="text-cyan-400" />
              Recipients
            </span>
            <span className="text-[10px] text-slate-500">
              Arthur & Ben prioritized
            </span>
          </div>

          {/* Recipient Cards */}
          <div className="flex flex-col gap-2.5">
            {sortedProfiles.map(person => {
              const isPriority = person.name.toLowerCase() === 'arthur' || person.name.toLowerCase() === 'ben';
              const isEditing = editingProfileId === person.id;
              const hasPhone = Boolean(person.phone && person.phone.trim());

              return (
                <div 
                  key={person.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPriority 
                      ? 'bg-slate-800/60 border-amber-500/40 shadow-sm' 
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Person Identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border ${
                        isPriority 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {person.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                            {person.name}
                          </span>
                          {isPriority && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40">
                              Primary
                            </span>
                          )}
                        </div>
                        {hasPhone && !isEditing ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <Smartphone size={10} className="text-cyan-400" />
                            <span>{formatPhoneDisplay(person.phone)}</span>
                            <button
                              onClick={() => startEditing(person)}
                              className="text-slate-500 hover:text-cyan-400 p-0.5 transition-colors"
                              title="Edit phone number"
                            >
                              <Pencil size={10} />
                            </button>
                          </div>
                        ) : !isEditing && (
                          <button
                            onClick={() => startEditing(person)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-0.5 underline-offset-2 hover:underline"
                          >
                            <Pencil size={10} />
                            <span>Set phone number</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions (if phone is set and not editing) */}
                    {hasPhone && !isEditing && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {/* iMessage Button (Enabled on Apple, Disabled on Non-Apple) */}
                        {isApple ? (
                          <button
                            onClick={() => handleSendIMessage(person)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 text-sky-200 border border-sky-500/50 text-[11px] font-bold transition-all active:scale-95 shadow-sm"
                            title={`Open iMessage to text ${person.name}`}
                          >
                            <MessageSquare size={11} className="text-sky-400" />
                            <span>💬 iMessage</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/50 text-[11px] font-bold cursor-not-allowed opacity-50"
                            title="iMessage is disabled on non-Apple products"
                          >
                            <MessageSquare size={11} className="text-slate-500" />
                            <span>iMessage (Apple Only)</span>
                          </button>
                        )}

                        {/* Copy Joke Button (Immediate 1-tap clipboard) */}
                        <button
                          onClick={handleCopyJoke}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition-all active:scale-95"
                          title={`Copy joke for ${person.name}`}
                        >
                          {copiedJoke ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          <span>{copiedJoke ? 'Copied' : 'Copy'}</span>
                        </button>

                        {/* Google Voice Button (Secondary Fallback) */}
                        <button
                          onClick={() => handleSendGoogleVoice(person)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-teal-300/80 hover:text-teal-200 border border-slate-700 text-[10px] font-bold transition-all active:scale-95"
                          title={`Open Google Voice thread with ${person.name}`}
                        >
                          <ExternalLink size={10} />
                          <span>Voice</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Phone Edit Form */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                      <input
                        type="tel"
                        placeholder="Phone (e.g. 801-555-1234)"
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        className="w-36 sm:flex-1 bg-black border border-cyan-500/50 focus:border-cyan-400 px-2.5 py-1 text-white text-xs rounded outline-none"
                        autoFocus
                      />
                      <button
                        disabled={savingProfileId === person.id}
                        onClick={() => handleSaveProfileInline(person.id)}
                        className="px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 border border-cyan-500/60 text-xs font-bold rounded transition-colors disabled:opacity-50"
                      >
                        {savingProfileId === person.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingProfileId(null); }}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* How It Works Explainer Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles size={12} className="text-sky-400" />
              <span>iMessage Dispatch System</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              On <strong>Apple devices</strong> (Mac, iPhone, iPad), tapping <strong>💬 iMessage</strong> launches the native Messages app with the recipient and joke pre-filled, while automatically copying the joke to your clipboard for quick paste.
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
              On <strong>non-Apple products</strong> (Windows, Android, Linux, wall tablets), iMessage is automatically disabled to prevent broken app errors. You can use the <strong>Copy</strong> button or Google Voice.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleCopyJoke}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copiedJoke ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedJoke ? 'Copied to Clipboard!' : 'Copy Joke Only'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
