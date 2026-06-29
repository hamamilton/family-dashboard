import { useState, useEffect } from 'react';
import { GripHorizontal, LayoutGrid, List, AlignJustify, Minimize } from 'lucide-react';
import { RewardBar } from '../features/RewardBar';
import { ChoreCard } from '../features/ChoreCard';

export function ChoreGrid({ sortedGroupEntries, profiles, groupBy, toggleChore, rotateAssignee, birthdayProfiles = [] }) {
    const [cardLayout, setCardLayout] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('choreCardLayout') || 'original';
        }
        return 'original';
    });

    useEffect(() => {
        localStorage.setItem('choreCardLayout', cardLayout);
    }, [cardLayout]);

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
                <h2 className="text-3xl font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] hidden sm:block">
                    &gt; Mission Board
                </h2>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-transparent shadow-sm dark:shadow-[0_0_10px_rgba(192,38,211,0.5)]"></div>
                
                {/* Layout Selector */}
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded border border-slate-300 dark:border-slate-700 shadow-inner">
                    {[
                        { id: 'original', icon: LayoutGrid, title: 'Original' },
                        { id: 'compact', icon: AlignJustify, title: 'Compact' },
                        { id: 'dense', icon: Minimize, title: 'Dense' },
                        { id: 'list', icon: List, title: 'List' }
                    ].map(layout => {
                        const Icon = layout.icon;
                        return (
                            <button
                                key={layout.id}
                                onClick={() => setCardLayout(layout.id)}
                                title={layout.title}
                                className={`p-1.5 rounded transition-all ${
                                    cardLayout === layout.id 
                                        ? 'bg-cyan-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                                }`}
                            >
                                <Icon size={18} />
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="space-y-16 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {sortedGroupEntries.map(([groupName, items]) => {
                // Find profile to pass to the RewardBar (only applies when grouped by Person)
                const profile = groupBy === 'assigned_to' && profiles
                    ? profiles.find(p => p.name === groupName)
                    : null;

                return (
                    <section key={groupName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">

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
                            <div className={`grid ${
                                cardLayout === 'list' 
                                    ? 'grid-cols-1 lg:grid-cols-2 gap-3' 
                                    : cardLayout === 'dense'
                                        ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3'
                                        : cardLayout === 'compact'
                                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                                            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6'
                            }`}>
                                {items.map((chore) => (
                                    <ChoreCard
                                        key={chore.id}
                                        chore={chore}
                                        onToggle={toggleChore}
                                        onRotate={rotateAssignee}
                                        layout={cardLayout}
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