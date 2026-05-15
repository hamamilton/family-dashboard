import { useState, useEffect } from 'react';
import { Sparkles, Trophy, MousePointer2, User } from 'lucide-react';
import { useSideQuest } from '../../hooks/useSideQuest';

export function SideQuest({ profiles = [], compact = false }) {
    const { quest, loading, claimQuest } = useSideQuest(profiles);
    const children = profiles.filter(p => !p.is_parent);
    
    const [shouldShow, setShouldShow] = useState(false);
    
    useEffect(() => {
        const checkVisibility = () => {
            const h = new Date().getHours();
            // Show randomly between 7am and 7pm
            if (h >= 7 && h <= 19) {
                const currentKey = `quest_show_${new Date().toISOString().split('T')[0]}_${h}`;
                let show = sessionStorage.getItem(currentKey);
                if (show === null) {
                    show = Math.random() > 0.5 ? 'true' : 'false';
                    sessionStorage.setItem(currentKey, show);
                }
                setShouldShow(show === 'true');
            } else {
                setShouldShow(false);
            }
        };
        checkVisibility();
        const interval = setInterval(checkVisibility, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    if (!shouldShow || loading || !quest) {
        return compact ? <div className="hidden" /> : (
            <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-6">
                <p className="text-slate-400 font-mono text-center my-auto tracking-widest text-sm">NO ACTIVE QUESTS DETECTED</p>
            </div>
        );
    }

    const completedBy = quest.expand?.completed_by;

    if (compact) {
        return (
            <div className={`flex items-center gap-3 p-2 px-4 border-2 font-mono transition-all duration-500 flex-1 relative overflow-hidden group ${
                quest.is_completed 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/50' 
                : 'bg-white dark:bg-black border-cyan-500 dark:border-cyan-900 shadow-[0_0_10px_rgba(6,182,212,0.2)] animate-pulse'
            }`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
                <Sparkles size={16} className={quest.is_completed ? 'text-emerald-500' : 'text-cyan-500'} />
                
                <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase truncate ${quest.is_completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                        {quest.title}
                    </p>
                </div>

                {!quest.is_completed ? (
                    <div className="flex gap-1">
                        {children.map(profile => (
                            <button
                                key={profile.id}
                                onClick={() => claimQuest(profile.id)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all"
                            >
                                {profile.name.substring(0,3)}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                        <Trophy size={10} /> {completedBy?.name || 'Unknown'}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full border-2 p-6 font-mono transition-all duration-500 relative overflow-hidden group ${
            quest.is_completed 
            ? 'bg-emerald-950/20 border-emerald-500/50' 
            : 'bg-white dark:bg-black border-cyan-500 dark:border-cyan-900 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
        }`}>
            {/* Background Sparkles for uncompleted */}
            {!quest.is_completed && (
                <Sparkles className="absolute -right-4 -top-4 text-cyan-400/10 group-hover:text-cyan-400/20 transition-all duration-1000" size={120} />
            )}

            <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`p-2 border-2 ${quest.is_completed ? 'border-emerald-500 text-emerald-500' : 'border-cyan-500 text-cyan-500 animate-pulse'}`}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white">
                        Daily Side Quest
                    </h2>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${quest.is_completed ? 'text-emerald-500' : 'text-cyan-600 dark:text-cyan-400'}`}>
                        {quest.is_completed ? 'Completed' : '15 XP // Speed Bonus'}
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                <div className={`p-5 border-2 transition-all ${
                    quest.is_completed 
                    ? 'border-emerald-900/50 bg-emerald-900/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                    <p className={`text-lg font-black uppercase leading-tight ${quest.is_completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                        {quest.title}
                    </p>
                </div>

                {!quest.is_completed ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Select your profile to claim:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {children.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => claimQuest(profile.id)}
                                    className="group flex items-center justify-between gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
                                >
                                    {profile.name}
                                    <MousePointer2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-emerald-500 animate-in zoom-in duration-500">
                        <Trophy size={32} className="mb-2" />
                        <p className="text-sm font-black uppercase tracking-tighter">Claimed by {completedBy?.name || 'Unknown'}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">+15 XP Awarded</p>
                    </div>
                )}
            </div>
            
            {/* Footer Status */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-900/50 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={10} />
                Node Status: {quest.is_completed ? 'Mission Logged' : 'Awaiting Completion'}
            </div>
        </div>
    );
}
