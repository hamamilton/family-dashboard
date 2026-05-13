import { useState } from 'react';
import { Utensils, GripHorizontal, RotateCcw, AlertTriangle } from 'lucide-react';
import { useMeals } from '../../hooks/useMeals';

export function MealPlanner() {
    const { meals, updateMeal, clearMeals } = useMeals();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClear = () => {
        clearMeals();
        setShowConfirm(false);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black p-6 border-2 border-slate-300 dark:border-cyan-900 shadow-lg dark:shadow-[0_0_30px_rgba(34,211,238,0.1)] relative">
            <div className="flex items-center justify-between mb-6 flex-none">
                <div className="flex items-center gap-4">
                    <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-400 transition-colors flex-none" />
                    <Utensils size={24} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <h2 className="text-2xl font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]">
                        Rations
                    </h2>
                </div>
                <button 
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border border-emerald-500/30"
                    title="Clear Meal Plan"
                >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Reset</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-3">
                    {meals.map((meal) => (
                        <div key={meal.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-2 border-b border-slate-200 dark:border-slate-800/60 focus-within:border-emerald-400 focus-within:dark:border-emerald-500/50 transition-colors pt-3">
                            <label className="text-xs font-black tracking-widest uppercase text-slate-500 dark:text-emerald-700 w-24 flex-none mt-1">
                                {meal.day.substring(0, 3)}
                            </label>
                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <input
                                    type="text"
                                    value={meal.main_dish || ''}
                                    onChange={(e) => updateMeal(meal.day, 'main_dish', e.target.value)}
                                    placeholder="MAIN DISH"
                                    className="w-full bg-transparent text-sm font-bold tracking-wider uppercase text-slate-800 dark:text-emerald-100 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-emerald-900/40"
                                />
                                <input
                                    type="text"
                                    value={meal.side_dish || ''}
                                    onChange={(e) => updateMeal(meal.day, 'side_dish', e.target.value)}
                                    placeholder="SIDE DISH / NOTES"
                                    className="w-full bg-transparent text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-emerald-600 focus:outline-none placeholder:text-slate-200 dark:placeholder:text-emerald-900/30"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
                    <div className="bg-white dark:bg-slate-950 border-2 border-emerald-400 p-8 w-full max-w-sm shadow-[0_0_30px_rgba(16,185,129,0.2)]" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                        <div className="flex flex-col items-center text-center gap-4 mb-6">
                            <AlertTriangle size={48} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                            <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white">Clear Rations?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                                Are you sure you want to clear the entire meal plan? This cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-transparent border-2 border-slate-500 text-slate-500 font-black uppercase tracking-widest py-3 hover:bg-slate-500 hover:text-white transition-colors text-xs"
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleClear}
                                className="flex-1 bg-emerald-500 text-black font-black uppercase tracking-widest py-3 hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] text-xs"
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
