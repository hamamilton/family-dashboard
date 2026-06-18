import { useState } from 'react';
import { X, Plus, Trash2, CalendarDays } from 'lucide-react';

export function SubscriptionsModal({ isOpen, onClose, subscriptions, addSubscription, removeSubscription }) {
    const [newUrl, setNewUrl] = useState('');

    if (!isOpen) return null;

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUrl.trim()) return;
        await addSubscription(newUrl.trim());
        setNewUrl('');
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
                    <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Add New Subscription (URL)</label>
                        <div className="flex gap-2">
                            <input 
                                type="url" 
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="https://example.com/calendar.ics"
                                className="flex-1 bg-black border border-slate-700 focus:border-cyan-400 px-3 py-2 text-white text-sm outline-none transition-colors"
                            />
                            <button type="submit" disabled={!newUrl.trim()}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest px-4 py-2 text-xs transition-colors disabled:opacity-50 flex items-center gap-1">
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    </form>

                    <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Subscriptions</h3>
                        {subscriptions.length === 0 ? (
                            <p className="text-slate-600 text-sm py-4 italic text-center">No active subscriptions</p>
                        ) : (
                            subscriptions.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between gap-4 p-3 border border-slate-800 bg-black/50 hover:border-slate-600 transition-colors">
                                    <p className="text-sm text-slate-300 truncate flex-1" title={sub.url}>{sub.url}</p>
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
