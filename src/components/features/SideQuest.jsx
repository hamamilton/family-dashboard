import { Sparkles, Trophy, MousePointer2, User } from 'lucide-react';
import { useSideQuest } from '../../hooks/useSideQuest';

export function SideQuest({ profiles = [], compact = false }) {
    const { quest, loading, claimQuest } = useSideQuest(profiles);
    const children = profiles.filter(p => !p.is_parent);

    if (loading) {
        if (compact) {
            return (
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/50 border border-[#444444] animate-pulse min-w-[120px]">
                    <Sparkles size={12} className="text-cyan-400" />
                    <div className="h-3 w-20 bg-slate-700 rounded" />
                </div>
            );
        }
        return (
            <div className="flex flex-col h-full bg-slate-900 border-2 border-slate-800 p-6 animate-pulse">
                <div className="h-6 w-32 bg-slate-800 mb-4" />
                <div className="h-12 w-full bg-slate-800" />
            </div>
        );
    }

    if (!quest) return null;

    const completedBy = quest.expand?.completed_by;

    if (compact) {
        return (
            <div 
                className={`flex items-center gap-2 px-3 py-1 shrink-0 ${
                    quest.is_completed
                        ? 'bg-emerald-950/40 border border-emerald-500/30'
                        : 'child-xp-badge'
                }`}
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
            >
                <Sparkles size={12} className={quest.is_completed ? 'text-emerald-400' : 'text-fuchsia-400 animate-pulse'} />
                <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] leading-none ${quest.is_completed ? 'text-emerald-500' : 'text-cyan-400'}`}>
                        Side Quest (+15 XP)
                    </span>
                    <span className={`text-[10px] font-black truncate max-w-[180px] leading-none mt-1 ${quest.is_completed ? 'text-emerald-400 line-through' : 'text-white'}`}>
                        {quest.title}
                    </span>
                </div>
                {!quest.is_completed ? (
                    <div className="flex gap-1 ml-2 pl-2 border-l border-white/10">
                        {children.map(profile => (
                            <button
                                key={profile.id}
                                onClick={() => claimQuest(profile.id)}
                                title={`Claim for ${profile.name}`}
                                className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 w-4 h-4 flex items-center justify-center text-[9px] font-black transition-colors"
                                style={{ clipPath: 'polygon(2px 0, 100% 0, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0 100%, 0 2px)' }}
                            >
                                {profile.name.charAt(0)}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-emerald-500/30 text-[9px] text-emerald-400 font-bold uppercase shrink-0">
                        <Trophy size={10} />
                        {completedBy?.name}
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
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-900/50 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={10} />
                Node Status: {quest.is_completed ? 'Mission Logged' : 'Awaiting Completion'}
            </div>
        </div>
    );
}
