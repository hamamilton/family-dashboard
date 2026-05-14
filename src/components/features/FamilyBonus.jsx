import { Gift, Star, Trophy, PartyPopper } from 'lucide-react';

export function FamilyBonus({ profiles = [] }) {
    const children = profiles.filter(p => !p.is_parent);
    const goalPerChild = 100;
    
    if (children.length === 0) return null;

    const childrenStatus = children.map(p => ({
        name: p.name,
        xp: p.xp_balance || 0,
        met: (p.xp_balance || 0) >= goalPerChild
    }));

    const allMet = childrenStatus.every(c => c.met);
    const totalMet = childrenStatus.filter(c => c.met).length;
    
    return (
        <div className={`flex flex-col h-full border-2 p-6 font-mono transition-all duration-700 ${
            allMet 
            ? 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 border-white shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse' 
            : 'bg-white dark:bg-black border-slate-300 dark:border-fuchsia-900 shadow-lg'
        }`}>
            <div className="flex items-center gap-4 mb-6">
                <div className={`p-2 border-2 ${allMet ? 'border-white text-white' : 'border-fuchsia-500 text-fuchsia-500'}`}>
                    {allMet ? <Trophy size={24} /> : <Gift size={24} />}
                </div>
                <div>
                    <h2 className={`text-2xl font-black uppercase tracking-widest ${allMet ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                        Family Bonus
                    </h2>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${allMet ? 'text-amber-900' : 'text-fuchsia-500'}`}>
                        {allMet ? 'REWARD UNLOCKED: MOVIE NIGHT!' : 'Goal: All Children reach 100 XP'}
                    </p>
                </div>
            </div>

            {allMet ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <PartyPopper size={64} className="text-white animate-bounce" />
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">MISSION ACCOMPLISHED</h3>
                    <p className="text-sm font-bold text-amber-900 uppercase tracking-widest bg-white/30 px-4 py-2">
                        Night Out / Movie Night Earned!
                    </p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        {childrenStatus.map(child => (
                            <div key={child.name} className={`p-3 border-2 transition-all ${
                                child.met 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                            }`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black uppercase tracking-wider">{child.name}</span>
                                    {child.met && <Star size={10} fill="currentColor" />}
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${child.met ? 'bg-emerald-500' : 'bg-fuchsia-500'}`}
                                        style={{ width: `${Math.min((child.xp / goalPerChild) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] font-bold mt-1 text-right">{child.xp}/100 XP</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-900">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span>Status</span>
                            <span>{totalMet} / {childrenStatus.length} Ready</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5">
                            <div 
                                className="h-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 shadow-[0_0_10px_rgba(192,38,211,0.5)] transition-all duration-1000"
                                style={{ width: `${(totalMet / childrenStatus.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
