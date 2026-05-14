import { Zap, Terminal, GripHorizontal, CheckSquare, Clock } from 'lucide-react';

const PROFILE_COLORS = [
    { border: 'border-cyan-400', glow: 'dark:shadow-[0_0_20px_rgba(34,211,238,0.3)]', text: 'text-cyan-400', bar: 'from-cyan-500 to-cyan-300' },
    { border: 'border-fuchsia-400', glow: 'dark:shadow-[0_0_20px_rgba(192,38,211,0.3)]', text: 'text-fuchsia-400', bar: 'from-fuchsia-500 to-fuchsia-300' },
    { border: 'border-emerald-400', glow: 'dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]', text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-300' },
    { border: 'border-violet-400', glow: 'dark:shadow-[0_0_20px_rgba(139,92,246,0.3)]', text: 'text-violet-400', bar: 'from-violet-500 to-violet-300' },
    { border: 'border-rose-400', glow: 'dark:shadow-[0_0_20px_rgba(244,63,94,0.3)]', text: 'text-rose-400', bar: 'from-rose-500 to-rose-300' },
];

function AgentCard({ profile, chores, colorScheme, birthdayProfiles = [] }) {
    const isOP = profile?.is_op || false;
    const currentXP = profile?.xp_balance || 0;
    const goalXP = 1000;
    const progress = Math.min((currentXP / goalXP) * 100, 100);
    const isBirthday = birthdayProfiles.includes(profile.name);

    // Get this person's pending chores
    const myChores = chores
        .filter(c => c.assigned_to === profile.name && !c.is_completed)
        .slice(0, 3); // Show max 3 upcoming chores

    const color = isOP
        ? { border: 'border-amber-400', glow: 'dark:shadow-[0_0_25px_rgba(245,158,11,0.5)]', text: 'text-amber-400', bar: 'from-amber-400 to-yellow-300' }
        : colorScheme;

    return (
        <div className={`flex-1 min-w-[200px] border-2 bg-white dark:bg-black font-mono transition-all duration-500 ${color.border} ${color.glow} shadow-sm`}
            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>

            {/* Header */}
            <div className={`px-4 pt-4 pb-3 border-b ${color.border} border-opacity-30`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 border ${color.border} ${color.text} ${isOP ? 'animate-pulse' : ''}`}>
                            {isOP ? <Zap size={14} /> : <Terminal size={14} />}
                        </div>
                        <div>
                            <p className={`text-[9px] font-bold uppercase tracking-[0.25em] ${color.text}`}>
                                {isBirthday ? '🎂 Birthday!' : isOP ? 'OP Active' : 'Agent'}
                            </p>
                            <p className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white leading-none mt-0.5">
                                {profile.name}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-2xl font-black tracking-tighter ${color.text}`}>{currentXP}</span>
                        <span className="text-slate-400 text-xs font-bold ml-1">XP</span>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="mt-3 h-2 w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div
                        className={`h-full bg-gradient-to-r ${color.bar} transition-all duration-1000`}
                        style={{ width: `${isOP ? 100 : progress}%` }}
                    />
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 tracking-widest">
                    {isOP ? 'MAX LEVEL' : `${currentXP} / ${goalXP} XP`}
                </p>
            </div>

            {/* Upcoming Chores */}
            <div className="px-4 py-3">
                <p className={`text-[9px] font-bold uppercase tracking-[0.25em] ${color.text} mb-2 flex items-center gap-1`}>
                    <Clock size={9} />
                    {isBirthday ? 'Chores Suspended' : 'Next Up'}
                </p>
                {isBirthday ? (
                    <p className="text-xs text-emerald-500 font-bold tracking-widest animate-bounce">🎉 Rest Day!</p>
                ) : myChores.length > 0 ? (
                    <ul className="space-y-1.5">
                        {myChores.map(chore => (
                            <li key={chore.id} className="flex items-center gap-2">
                                <CheckSquare size={10} className="text-slate-300 dark:text-slate-700 flex-none" />
                                <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">
                                    {chore.chore_name}
                                </span>
                                {chore.xp_reward && (
                                    <span className={`text-[9px] font-black ${color.text} ml-auto flex-none`}>+{chore.xp_reward}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-600 tracking-widest">All clear!</p>
                )}
            </div>
        </div>
    );
}

export function AgentProfiles({ profiles = [], chores = [], birthdayProfiles = [] }) {
    if (profiles.length === 0) return null;

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-6 mb-6 flex-none">
                <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-cyan-400 transition-colors flex-none" />
                <h2 className="text-3xl font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                    &gt; Agent Profiles
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-transparent" />
            </div>

            <div className="flex flex-row gap-4 flex-1 overflow-x-auto pb-2">
                {profiles.filter(p => !p.is_parent).map((profile, idx) => (
                    <AgentCard
                        key={profile.id}
                        profile={profile}
                        chores={chores}
                        colorScheme={PROFILE_COLORS[idx % PROFILE_COLORS.length]}
                        birthdayProfiles={birthdayProfiles}
                    />
                ))}
            </div>
        </div>
    );
}
