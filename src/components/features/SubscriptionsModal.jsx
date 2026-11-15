import { useState } from 'react';
import { X, Plus, Trash2, CalendarDays, Loader2, CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, Edit2, Check } from 'lucide-react';
import { normalizeCalendarUrl } from '../../hooks/useCalendar';

export function SubscriptionsModal({ isOpen, onClose, subscriptions, addSubscription, updateSubscription, removeSubscription, profiles = [] }) {
    const [newUrl, setNewUrl] = useState('');
    const [assignee, setAssignee] = useState(['Everyone']);
    const [adding, setAdding] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
    const [showHelp, setShowHelp] = useState(false);
    const [editingSubId, setEditingSubId] = useState(null);
    const [editingAssignees, setEditingAssignees] = useState(['Everyone']);
    const [savingSubId, setSavingSubId] = useState(null);

    if (!isOpen) return null;

    const previewUrl = normalizeCalendarUrl(newUrl);
    const isConverted = newUrl.trim() !== '' && previewUrl !== newUrl.trim();

    const toggleListAssignee = (list, name) => {
        let nextAssigned = [...list];
        if (name === 'Everyone') {
            return ['Everyone'];
        }
        if (nextAssigned.includes('Everyone')) {
            return [name];
        }
        if (nextAssigned.includes(name)) {
            nextAssigned = nextAssigned.filter(n => n !== name);
            if (nextAssigned.length === 0) {
                nextAssigned = ['Everyone'];
            }
        } else {
            nextAssigned.push(name);
        }
        return nextAssigned;
    };

    const toggleAssignee = (name) => {
        setAssignee(prev => toggleListAssignee(prev, name));
    };

    const startEditingSub = (sub) => {
        const current = (sub.assignee || 'Everyone').split(',').map(s => s.trim()).filter(Boolean);
        setEditingSubId(sub.id);
        setEditingAssignees(current.length > 0 ? current : ['Everyone']);
    };

    const handleSaveSubAssignee = async (subId) => {
        if (!updateSubscription) return;
        setSavingSubId(subId);
        try {
            await updateSubscription(subId, editingAssignees.join(', '));
            setEditingSubId(null);
        } finally {
            setSavingSubId(null);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUrl.trim() || adding) return;
        setAdding(true);
        setFeedback(null);
        try {
            const res = await addSubscription(newUrl.trim(), assignee.join(', '));
            if (res && !res.ok) {
                setFeedback({
                    type: 'error',
                    message: res.error || 'Could not load calendar feed.'
                });
            } else {
                const nameLabel = res?.calendarName ? `"${res.calendarName}"` : 'Calendar feed';
                const countLabel = typeof res?.eventCount === 'number' ? ` (${res.eventCount} events loaded)` : '';
                setFeedback({
                    type: 'success',
                    message: `Synced ${nameLabel}${countLabel}!`
                });
                setNewUrl('');
                setAssignee(['Everyone']);
            }
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-950 border-2 border-cyan-800 w-full max-w-lg shadow-[0_0_40px_rgba(34,211,238,0.2)] font-mono flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 flex-none">
                    <h2 className="text-xl font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                        <CalendarDays size={20} />
                        iCal Subscriptions
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-6 border-b border-slate-800 pb-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">
                                    Calendar URL, Share Link, or Google Calendar ID
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowHelp(prev => !prev)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                                >
                                    <HelpCircle size={12} />
                                    <span>How to get link</span>
                                    {showHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                            </div>

                            {showHelp && (
                                <div className="p-3 bg-slate-900/80 border border-cyan-900/60 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                                    <p className="font-bold text-cyan-400 uppercase tracking-wider">Google Calendar Setup:</p>
                                    <p>1. Open Google Calendar on desktop → click <strong>⋮</strong> next to the calendar → <strong>Settings and sharing</strong>.</p>
                                    <p>2. Scroll down to <strong>Integrate calendar</strong>:</p>
                                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                                        <li><strong className="text-slate-200">Private / Family Calendar:</strong> Copy the <strong>Secret address in iCal format</strong> (contains <code className="text-pink-400">/private-.../basic.ics</code>).</li>
                                        <li><strong className="text-slate-200">Public Calendar:</strong> Make sure <em>"Make available to public"</em> is checked, then paste any share link, embed URL, Calendar ID, or iCal address.</li>
                                    </ul>
                                </div>
                            )}

                            <input 
                                type="text" 
                                value={newUrl}
                                onChange={e => {
                                    setNewUrl(e.target.value);
                                    if (feedback) setFeedback(null);
                                }}
                                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                                className="w-full bg-black border border-slate-700 focus:border-cyan-400 px-3 py-2 text-white text-sm outline-none transition-colors"
                            />

                            {isConverted && (
                                <div className="p-2 bg-cyan-950/30 border border-cyan-800/50 text-[10px] text-cyan-300 break-all">
                                    <span className="font-bold uppercase tracking-wider text-cyan-400">✨ Auto-converted to iCal feed: </span>
                                    <span>{previewUrl}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Assign To</label>
                            <div className="flex flex-wrap gap-1.5">
                                <button 
                                    type="button"
                                    onClick={() => toggleAssignee('Everyone')}
                                    className={`px-3 py-1.5 text-xs font-black uppercase border transition-colors ${
                                        assignee.includes('Everyone')
                                            ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                                            : 'border-slate-800 text-slate-500 hover:border-amber-400'
                                    }`}
                                >
                                    Everyone
                                </button>
                                {profiles.map(p => {
                                    const isSelected = assignee.includes(p.name);
                                    return (
                                        <button 
                                            key={p.id} 
                                            type="button"
                                            onClick={() => toggleAssignee(p.name)}
                                            className={`px-3 py-1.5 text-xs font-black uppercase border transition-colors ${
                                                isSelected
                                                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-500'
                                                    : 'border-slate-800 text-slate-500 hover:border-cyan-400'
                                            }`}
                                        >
                                            {p.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {feedback && (
                            <div className={`p-3 border text-xs flex items-start gap-2 ${
                                feedback.type === 'success'
                                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                                    : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                            }`}>
                                {feedback.type === 'success' ? (
                                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                                )}
                                <span className="leading-relaxed">{feedback.message}</span>
                            </div>
                        )}

                        <button type="submit" disabled={!newUrl.trim() || adding}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest px-4 py-3 text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
                            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {adding ? 'Verifying & Syncing Feed...' : 'Add Subscription'}
                        </button>
                    </form>

                    <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Subscriptions</h3>
                        {subscriptions.length === 0 ? (
                            <p className="text-slate-600 text-sm py-4 italic text-center">No active subscriptions</p>
                        ) : (
                            subscriptions.map(sub => (
                                <div key={sub.id} className="flex flex-col gap-2 p-3 border border-slate-800 bg-black/50 hover:border-slate-600 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-col flex-1 min-w-0 gap-1">
                                            {sub.calendarName && (
                                                <p className="text-xs font-black text-white uppercase tracking-wider truncate">
                                                    {sub.calendarName}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400 truncate" title={sub.url}>{sub.url}</p>
                                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                                                    Assigned to: {sub.assignee || 'Everyone'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => editingSubId === sub.id ? setEditingSubId(null) : startEditingSub(sub)}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                                                    title="Change assigned family member(s)"
                                                >
                                                    <Edit2 size={10} />
                                                    <span>{editingSubId === sub.id ? 'Cancel' : 'Edit'}</span>
                                                </button>
                                                {sub.status === 'loading' && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Loader2 size={10} className="animate-spin" /> Syncing...
                                                    </span>
                                                )}
                                                {sub.status === 'ok' && (
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                                        ✓ {sub.eventCount ?? 0} events synced
                                                    </span>
                                                )}
                                            </div>
                                            {sub.status === 'error' && sub.error && (
                                                <p className="text-[10px] text-rose-400 mt-1 leading-snug">
                                                    ⚠️ {sub.error}
                                                </p>
                                            )}
                                        </div>
                                        <button onClick={() => removeSubscription(sub.id)} className="text-slate-500 hover:text-rose-400 p-1 flex-none transition-colors" title="Remove Subscription">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {editingSubId === sub.id && (
                                        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingAssignees(prev => toggleListAssignee(prev, 'Everyone'))}
                                                    className={`px-2 py-1 text-[10px] font-black uppercase border transition-colors ${
                                                        editingAssignees.includes('Everyone')
                                                            ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                                                            : 'border-slate-800 text-slate-500 hover:border-amber-400'
                                                    }`}
                                                >
                                                    Everyone
                                                </button>
                                                {profiles.map(p => {
                                                    const isSelected = editingAssignees.includes(p.name);
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => setEditingAssignees(prev => toggleListAssignee(prev, p.name))}
                                                            className={`px-2 py-1 text-[10px] font-black uppercase border transition-colors ${
                                                                isSelected
                                                                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-500'
                                                                    : 'border-slate-800 text-slate-500 hover:border-cyan-400'
                                                            }`}
                                                        >
                                                            {p.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    disabled={savingSubId === sub.id}
                                                    onClick={() => handleSaveSubAssignee(sub.id)}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest px-3 py-1 text-[10px] transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {savingSubId === sub.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                                    Save Assignees
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
