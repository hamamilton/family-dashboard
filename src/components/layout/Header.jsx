import { User, Sun, Moon } from 'lucide-react';
import { SideQuest } from '../features/SideQuest';

export function Header({ isDarkMode, childrenProfiles = [], profiles = [] }) {
    return (
        <header className="flex items-center gap-4 px-4 py-2 font-mono border-b border-[#333333] header-bg flex-none h-[60px]">
            {/* Left: Title */}
            <div className="flex items-center gap-3 shrink-0">
                <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400">
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
                            className="flex flex-col px-3 py-1 child-xp-badge shrink-0"
                            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400 leading-none">{child.name}</span>
                            <span className="text-sm font-black text-white leading-none">{child.xp_balance || 0} <span className="text-[9px] text-fuchsia-500">XP</span></span>
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