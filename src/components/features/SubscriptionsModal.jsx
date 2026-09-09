import { useState } from 'react';
import { X, Plus, Trash2, CalendarDays } from 'lucide-react';

export function SubscriptionsModal({ isOpen, onClose, subscriptions, addSubscription, removeSubscription, profiles = [] }) {
    const [newUrl, setNewUrl] = useState('');
    const [assignee, setAssignee] = useState(['Everyone']);

    if (!isOpen) return null;

    const toggleAssignee = (name) => {
        setAssignee(prev => {
            let nextAssigned = [...prev];
            
            if (name === 'Everyone') {
                return ['Everyone'];
            }
            
            if (nextAssigned.includes('Everyone')) {
                nextAssigned = [name];
                return nextAssigned;
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
        });
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUrl.trim()) return;
        await addSubscription(newUrl.trim(), assignee.join(', '));
        setNewUrl('');
        setAssignee(['Everyone']);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-950 border-2 border-cyan-800 w-full max-w-lg shadow-[0_0_40px_rgba(34,211,238,0.2)] font-mono flex flex-col max-h-[80vh]">
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
                            <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Add New Subscription (URL)</label>
                            <input 
                                type="url" 
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="https://example.com/calendar.ics"
                                className="w-full bg-black border border-slate-700 focus:border-cyan-400 px-3 py-2 text-white text-sm outline-none transition-colors"
                            />
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

                        <button type="submit" disabled={!newUrl.trim()}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest px-4 py-3 text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                            <Plus size={16} /> Add Subscription
                        </button>
                    </form>

                    <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Subscriptions</h3>
                        {subscriptions.length === 0 ? (
                            <p className="text-slate-600 text-sm py-4 italic text-center">No active subscriptions</p>
                        ) : (
                            subscriptions.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between gap-4 p-3 border border-slate-800 bg-black/50 hover:border-slate-600 transition-colors">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <p className="text-sm text-slate-300 truncate" title={sub.url}>{sub.url}</p>
                                        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1">
                                            Assigned to: {sub.assignee || 'Everyone'}
                                        </span>
                                    </div>
                                    <button onClick={() => removeSubscription(sub.id)} className="text-slate-500 hover:text-rose-400 p-1 flex-none transition-colors" title="Remove Subscription">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
