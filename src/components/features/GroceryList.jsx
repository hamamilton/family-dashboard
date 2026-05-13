import { useState } from 'react';
import { ShoppingCart, Check, Trash2, Plus, GripHorizontal } from 'lucide-react';
import { useGroceries } from '../../hooks/useGroceries';

export function GroceryList() {
    const { groceries, addGrocery, toggleGrocery, clearChecked } = useGroceries();
    const [newItem, setNewItem] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newItem.trim()) {
            addGrocery(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black p-6 border-2 border-slate-300 dark:border-cyan-900 shadow-lg dark:shadow-[0_0_30px_rgba(34,211,238,0.1)] relative">
            <div className="flex items-center justify-between mb-6 flex-none">
                <div className="flex items-center gap-4">
                    <GripHorizontal size={24} className="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-amber-400 transition-colors flex-none" />
                    <ShoppingCart size={24} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <h2 className="text-2xl font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                        Logistics
                    </h2>
                </div>
                <button 
                    onClick={clearChecked}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest border border-slate-300 dark:border-rose-900 text-slate-500 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-400 dark:hover:bg-rose-950 transition-colors"
                >
                    <Trash2 size={14} />
                    <span>Clear</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="mb-4 flex-none relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                    <Plus size={18} />
                </div>
                <input 
                    type="text" 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="ADD TO INVENTORY..."
                    className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-amber-900/50 p-3 pl-10 text-sm font-bold tracking-widest uppercase text-slate-800 dark:text-amber-100 focus:outline-none focus:border-amber-400 focus:dark:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all placeholder:text-slate-400 dark:placeholder:text-amber-900/60"
                />
            </form>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {groceries.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-amber-900/50 text-xs font-bold tracking-widest uppercase">
                        Inventory Optimal
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {groceries.map(item => (
                            <button
                                key={item.id}
                                onClick={() => toggleGrocery(item.id)}
                                className={`flex items-center gap-4 p-3 border-l-2 text-left transition-all group ${
                                    item.is_checked 
                                        ? 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30' 
                                        : 'border-amber-400 dark:border-amber-500 bg-white dark:bg-amber-950/20 hover:bg-slate-50 dark:hover:bg-amber-900/30'
                                }`}
                            >
                                <div className={`flex items-center justify-center w-5 h-5 border transition-colors ${
                                    item.is_checked 
                                        ? 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500' 
                                        : 'border-amber-400 dark:border-amber-600 bg-transparent text-transparent group-hover:border-amber-500'
                                }`}>
                                    {item.is_checked && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span className={`text-sm font-bold tracking-wider uppercase transition-colors ${
                                    item.is_checked 
                                        ? 'text-slate-400 dark:text-slate-600 line-through' 
                                        : 'text-slate-700 dark:text-amber-100'
                                }`}>
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
