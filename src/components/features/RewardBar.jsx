import { Zap, Terminal } from 'lucide-react';

export function RewardBar({ profile, goalXP = 100 }) {
    const isOP = profile?.is_op || false;
    const currentXP = profile?.xp_balance || 0;
    const name = profile?.name || 'Player';

    const progress = Math.min((currentXP / goalXP) * 100, 100);

    return (
        <div className={`mb-12 p-6 border-2 transition-all duration-700 font-mono relative overflow-hidden ${isOP
            ? 'bg-amber-50 dark:bg-black border-amber-400 shadow-sm dark:shadow-[0_0_30px_rgba(245,158,11,0.4)]'
            : 'bg-white dark:bg-black border-fuchsia-300 dark:border-fuchsia-900 shadow-sm dark:shadow-[0_0_20px_rgba(192,38,211,0.15)]'
            }`}
            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">

                <div className="flex items-center gap-4">
                    <div className={`p-3 border-2 ${isOP ? 'border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse' : 'border-cyan-500 text-cyan-400'
                        }`}>
                        {isOP ? <Zap size={24} /> : <Terminal size={24} />}
                    </div>
                    <div>
                        <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isOP ? 'text-amber-600 dark:text-amber-400' : 'text-fuchsia-600 dark:text-fuchsia-500'
                            }`}>
                            {isOP ? 'SYS.OVERRIDE // OP_ACTIVE' : 'XP_UPLINK // ESTABLISHED'}
                        </h4>
                        <p className="text-3xl font-black mt-1 text-slate-800 dark:text-white uppercase tracking-widest">{name}</p>
                    </div>
                </div>

                <div className="text-left md:text-right">
                    <span className={`text-5xl font-black tracking-tighter ${isOP ? 'text-amber-500 dark:text-amber-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                        }`}>
                        {currentXP}
                    </span>
                    <span className="text-slate-500 font-bold ml-2 text-xl">XP</span>
                </div>
            </div>

            {/* The Energy Meter */}
            <div className="relative h-6 w-full bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 p-1">
                <div
                    className={`absolute top-1 left-1 h-4 transition-all duration-1000 ease-out ${isOP
                        ? 'bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,1)]'
                        : 'bg-gradient-to-r from-fuchsia-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                        }`}
                    style={{ width: `calc(${isOP ? 100 : progress}% - 8px)` }}
                />

                {/* Shimmer Effect */}
                {isOP && (
                    <div
                        className="absolute top-0 left-0 h-full w-full opacity-50 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]"
                        style={{ transform: 'translateX(-100%)' }}
                    />
                )}
            </div>
        </div>
    );
}