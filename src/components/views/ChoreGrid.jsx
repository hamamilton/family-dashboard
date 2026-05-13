import { GripHorizontal } from 'lucide-react';
import { RewardBar } from '../features/RewardBar';
import { ChoreCard } from '../features/ChoreCard';

export function ChoreGrid({ sortedGroupEntries, profiles, groupBy, toggleChore, birthdayProfiles = [] }) {
    if (sortedGroupEntries.length === 0) {
        return (
            <div className="p-20 text-center border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-[3rem] bg-slate-100 dark:bg-slate-900/30">
                <p className="text-slate-500 text-2xl font-bold italic">No chores assigned for this view.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-6 mb-8 flex-none">
                <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-cyan-400 transition-colors flex-none" />
                <h2 className="text-3xl font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                    &gt; Mission Board
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-transparent shadow-sm dark:shadow-[0_0_10px_rgba(192,38,211,0.5)]"></div>
            </div>
            
            <div className="space-y-16 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {sortedGroupEntries.map(([groupName, items]) => {
                // Find profile to pass to the RewardBar (only applies when grouped by Person)
                const profile = groupBy === 'assigned_to' && profiles
                    ? profiles.find(p => p.name === groupName)
                    : null;

                return (
                    <section key={groupName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* GAMIFICATION: Only shows when viewing by Person */}
                        {profile && <RewardBar profile={profile} goalXP={1000} />}

                        {/* CATEGORY HEADER */}
                        <div className="flex items-center gap-6 mb-8 font-mono">
                            <h2 className="text-4xl font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                                &gt; {groupName}
                            </h2>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-transparent shadow-sm dark:shadow-[0_0_10px_rgba(192,38,211,0.5)]"></div>
                            {!birthdayProfiles.includes(groupName) && (
                                <span className="text-xs font-black bg-white dark:bg-black text-fuchsia-600 dark:text-fuchsia-400 px-4 py-2 border border-fuchsia-300 dark:border-fuchsia-500/50 shadow-sm dark:shadow-[0_0_10px_rgba(192,38,211,0.2)] tracking-widest">
                                    {items.length} {items.length === 1 ? 'TASK' : 'TASKS'}
                                </span>
                            )}
                        </div>

                        {/* TASK GRID OR BIRTHDAY BANNER */}
                        {birthdayProfiles.includes(groupName) ? (
                            <div className="p-12 text-center border-4 border-dashed border-emerald-300 dark:border-emerald-800 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20">
                                <h3 className="text-3xl font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
                                    🎂 HAPPY BIRTHDAY! 🎂
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 font-mono tracking-widest">ALL CHORES SUSPENDED. ENJOY YOUR REST DAY!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                                {items.map((chore) => (
                                    <ChoreCard
                                        key={chore.id}
                                        chore={chore}
                                        onToggle={toggleChore}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
        </div>
    );
}