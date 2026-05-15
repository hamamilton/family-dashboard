import { User, Calendar as CalendarIcon, Repeat, Sun, Moon, Shield, Maximize, Lock, Unlock } from 'lucide-react';
import { WeatherWidget } from '../features/WeatherWidget';
import { SideQuest } from '../features/SideQuest';
import { AgentProfiles } from '../features/AgentProfiles';
import { FamilyBonus } from '../features/FamilyBonus';

export function Header({ isDarkMode, toggleDarkMode, onAdminOpen, profiles, chores, birthdayProfiles, isLayoutLocked, toggleLayoutLock }) {
    const toggleFullscreen = async () => {
        try {
            const elem = document.documentElement;
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            
            if (!isFullscreen) {
                if (elem.requestFullscreen) {
                    const p = elem.requestFullscreen();
                    if (p) await p;
                } else if (elem.webkitRequestFullscreen) {
                    const p = elem.webkitRequestFullscreen();
                    if (p) await p;
                } else if (elem.msRequestFullscreen) {
                    const p = elem.msRequestFullscreen();
                    if (p) await p;
                } else {
                    alert("Fullscreen API is not supported on this device/browser.");
                }
            } else {
                if (document.exitFullscreen) {
                    const p = document.exitFullscreen();
                    if (p) await p;
                } else if (document.webkitExitFullscreen) {
                    const p = document.webkitExitFullscreen();
                    if (p) await p;
                } else if (document.msExitFullscreen) {
                    const p = document.msExitFullscreen();
                    if (p) await p;
                }
            }
        } catch (err) {
            console.error(err);
            alert("Fullscreen error: " + err.message);
        }
    };

    return (
        <header className="mb-6 flex flex-col gap-6 font-mono uppercase flex-none">
            <div className="flex flex-col xl:flex-row justify-between items-start gap-6">

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full xl:w-auto">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-[0_0_15px_rgba(192,38,211,0.4)]">
                        FAMILY HUB
                    </h1>
                    <p className="text-cyan-600 font-bold tracking-[0.3em] text-xs mt-2">
                        Iowa City Node // <span className="text-fuchsia-500">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </p>
                </div>

                <div className="hidden lg:flex gap-2 items-center">
                    <button
                        onClick={toggleLayoutLock}
                        className={`p-3 bg-white dark:bg-black border-2 transition-all shadow-sm ${
                            isLayoutLocked 
                            ? 'border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600' 
                            : 'border-amber-500/50 dark:border-amber-900 text-amber-600 dark:text-amber-500 hover:border-amber-400'
                        }`}
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 12px)' }}
                        aria-label={isLayoutLocked ? "Unlock Layout" : "Lock Layout"}
                        title={isLayoutLocked ? "Unlock Layout" : "Lock Layout"}
                    >
                        {isLayoutLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-emerald-800 text-slate-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:border-emerald-400 transition-all shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 12px)' }}
                        aria-label="Kiosk Mode"
                        title="Kiosk Mode"
                    >
                        <Maximize size={20} />
                    </button>
                    <button
                        onClick={toggleDarkMode}
                        className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-800 text-slate-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 transition-all shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 12px)' }}
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        onClick={onAdminOpen}
                        className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-fuchsia-900 text-slate-500 dark:text-fuchsia-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-300 hover:border-fuchsia-400 transition-all shadow-sm"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 12px)' }}
                        aria-label="Admin Panel"
                        title="Admin Panel"
                    >
                        <Shield size={20} />
                    </button>
                    <SideQuest profiles={profiles} compact={true} />
                    <WeatherWidget />
                </div>
            </div>
            </div>

            {/* Widget Row */}
            <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
                <div className="flex-1 overflow-x-auto custom-scrollbar-hide">
                    <AgentProfiles 
                        profiles={profiles} 
                        chores={chores} 
                        birthdayProfiles={birthdayProfiles} 
                        compact={true} 
                    />
                </div>
                <div className="lg:w-[350px] flex-none">
                    <FamilyBonus 
                        profiles={profiles} 
                        compact={true} 
                    />
                </div>
            </div>

            <div className="flex md:hidden w-full mt-2 gap-4">
                <button
                    onClick={toggleLayoutLock}
                    className={`p-3 bg-white dark:bg-black border-2 transition-all ${
                        isLayoutLocked 
                        ? 'border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600' 
                        : 'border-amber-500/50 dark:border-amber-900 text-amber-600 dark:text-amber-500 hover:border-amber-400'
                    }`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                    aria-label={isLayoutLocked ? "Unlock Layout" : "Lock Layout"}
                >
                    {isLayoutLocked ? <Lock size={20} /> : <Unlock size={20} />}
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-emerald-800 text-slate-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:border-emerald-400 transition-all"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                    aria-label="Kiosk Mode"
                >
                    <Maximize size={20} />
                </button>
                <button
                    onClick={toggleDarkMode}
                    className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-800 text-slate-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 transition-all"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                    aria-label="Toggle Dark Mode"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                    onClick={onAdminOpen}
                    className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-fuchsia-900 text-slate-500 dark:text-fuchsia-500 hover:text-fuchsia-600 hover:border-fuchsia-400 transition-all"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                    aria-label="Admin Panel"
                >
                    <Shield size={20} />
                </button>
                <div className="flex-1 flex gap-2">
                    <SideQuest profiles={profiles} compact={true} />
                    <WeatherWidget />
                </div>
            </div>
        </header>
    );
}