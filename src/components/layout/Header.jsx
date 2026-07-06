import { User, Sun, Moon, Menu, X, Zap } from 'lucide-react';
import { SideQuest } from '../features/SideQuest';

export function Header({ isDarkMode, childrenProfiles = [], profiles = [], isMobileMenuOpen, setIsMobileMenuOpen }) {
    const allOP = childrenProfiles.length > 0 && childrenProfiles.every(c => c.is_op);

    return (
        <header className="flex items-center gap-4 px-4 py-2 font-mono border-b border-[#333333] header-bg flex-none h-[60px]">
            {/* Left: Menu Toggle (Mobile Only) + Title */}
            <div className="flex items-center gap-3 shrink-0">
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-1 text-cyan-400 hover:bg-cyan-900/30 rounded-md transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h1 className={`text-xl flex items-center gap-1 font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${allOP ? 'from-amber-500 via-yellow-400 to-amber-500 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-400 animate-pulse drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'from-cyan-600 via-fuchsia-600 to-amber-600 dark:from-cyan-400 dark:via-fuchsia-500 dark:to-amber-400'}`}>
                    {allOP && <Zap size={18} className="text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.8))' }} />}
                    FAMILY HUB
                </h1>
                <span className="hidden md:block text-cyan-600 font-bold tracking-[0.2em] text-[10px] border-l border-[#444444] pl-3">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            </div>

            {/* Center: Child XP Profiles + compact widgets */}
            <div className="flex items-center gap-3 flex-1 overflow-x-auto scrollbar-none">
                {childrenProfiles && childrenProfiles.length > 0 ? (
                    childrenProfiles.map(child => (
                        <div
                            key={child.id}
                            className={`flex flex-col px-3 py-1 shrink-0 ${child.is_op ? 'border border-amber-400 bg-amber-400/10 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse' : 'child-xp-badge'}`}
                            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                        >
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] leading-none flex items-center gap-1 ${child.is_op ? 'text-amber-500 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'}`}>
                                {child.name}
                                {child.is_op && <Zap size={10} className="fill-amber-400" />}
                            </span>
                            <span className={`text-sm font-black leading-none ${child.is_op ? 'text-amber-600 dark:text-amber-300' : 'text-slate-800 dark:text-white'}`}>
                                {child.is_op ? 'OP' : child.xp_balance || 0} 
                                {!child.is_op && <span className="text-[9px] text-fuchsia-700 dark:text-fuchsia-500"> XP</span>}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-amber-500 text-xs font-bold animate-pulse shrink-0">Waiting for profiles...</div>
                )}
                
                {/* Side Quest compact widget */}
                <SideQuest profiles={profiles} compact={true} />
            </div>
        </header>
    );
}