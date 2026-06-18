import { CheckSquare, Square, AlertCircle, RefreshCw } from 'lucide-react';
import { isChoreOverdue } from '../../hooks/useChores';

export function ChoreCard({ chore, onToggle, onRotate }) {
    const isPoolArray = Array.isArray(chore.round_robin_pool) && chore.round_robin_pool.length > 1;
    const isPoolString = typeof chore.round_robin_pool === 'string' && chore.round_robin_pool.split(',').filter(Boolean).length > 1;
    const canRotate = !chore.is_future && !chore.is_completed && (isPoolArray || isPoolString);
    return (
        <button
            onClick={() => { if (!chore.is_future) onToggle(chore.id, chore.is_completed, chore.assigned_to?.includes('(Covered by')) }}
            className={`chore-card group relative p-6 border-2 text-left transition-all duration-300 w-full uppercase font-mono ${
                chore.is_completed
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 opacity-60 scale-95'
                    : chore.is_future
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-70 cursor-not-allowed'
                        : 'border-cyan-200 dark:border-cyan-800 bg-white dark:bg-black hover:border-cyan-400 dark:hover:border-cyan-400 shadow-sm hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:-translate-y-1 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
            }`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }} // Cyberpunk cut-corner
            disabled={chore.is_future}
        >
            <div className="flex flex-col h-full justify-between min-h-[140px]">
                <div>
                    <h3 className={`text-2xl font-black mb-2 leading-none tracking-widest ${chore.is_completed ? 'line-through text-emerald-700 dark:text-emerald-700' : 'text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'
                        }`}>
                        {chore.chore_name.replace('[STRICT]', '').trim()}
                        {chore.chore_name.includes('[STRICT]') && (
                            <span className="ml-3 inline-block align-top text-[10px] bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/50 px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">
                                Strict
                            </span>
                        )}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                            <p className={`text-sm tracking-[0.2em] font-bold ${chore.is_completed ? 'text-emerald-700 dark:text-emerald-900' : 'text-fuchsia-600 dark:text-fuchsia-500'
                                }`}>
                                <span className="text-slate-400 dark:text-slate-600 mr-2">&gt;</span>
                                {chore.assigned_to || 'UNASSIGNED'}
                            </p>
                            {canRotate && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRotate(chore.id); }}
                                    className="p-1 rounded-sm text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-cyan-500 transition-colors group/rotate z-10 relative"
                                    title="Rotate Assignee"
                                >
                                    <RefreshCw size={14} className="group-hover/rotate:animate-spin" />
                                </button>
                            )}
                        </div>
                        
                        {!chore.is_completed && !chore.is_future && isChoreOverdue(chore) && (
                            <div className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 px-2 py-1 font-bold tracking-widest border border-red-300 dark:border-red-800 animate-pulse">
                                <AlertCircle size={12} />
                                OVERDUE
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-end w-full">
                    {/* Faux Data Hash for visual texture */}
                    <div className="text-[10px] text-slate-400 dark:text-slate-700 tracking-widest">
                        ID:{chore.id.slice(0, 5)}
                    </div>

                    {chore.is_completed ? (
                        <CheckSquare size={32} className="text-emerald-500 drop-shadow-sm dark:drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    ) : chore.is_future ? (
                        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 opacity-50" />
                    ) : (
                        <Square size={32} className="text-cyan-400 dark:text-cyan-700 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
                    )}
                </div>
            </div>
        </button>
    );
}