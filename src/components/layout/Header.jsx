import { User, Calendar as CalendarIcon, Repeat, Sun, Moon } from 'lucide-react';
import { WeatherWidget } from '../features/WeatherWidget';

export function Header({ groupBy, setGroupBy, isDarkMode, toggleDarkMode }) {
    const tabs = [
        { id: 'assigned_to', label: 'By Person', icon: <User size={18} /> },
        { id: 'day_due', label: 'By Day', icon: <CalendarIcon size={18} /> },
        { id: 'frequency', label: 'Frequency', icon: <Repeat size={18} /> }
    ];

    return (
        <header className="mb-6 flex flex-col xl:flex-row justify-between items-start gap-6 font-mono uppercase flex-none">

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
                        onClick={toggleDarkMode}
                        className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-800 text-slate-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 transition-all shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <WeatherWidget />
                </div>
            </div>

            <div className="flex bg-white dark:bg-black p-1.5 border-2 border-slate-300 dark:border-cyan-900 shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.1)] xl:self-center w-full md:w-auto overflow-x-auto" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setGroupBy(tab.id)}
                        className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 text-xs md:px-6 md:py-3 md:text-sm font-black transition-all duration-300 tracking-widest ${groupBy === tab.id
                            ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-400 dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] shadow-sm'
                            : 'text-slate-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 border border-transparent'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex md:hidden w-full mt-2 gap-4">
                <button
                    onClick={toggleDarkMode}
                    className="p-3 bg-white dark:bg-black border-2 border-slate-300 dark:border-cyan-800 text-slate-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 transition-all"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                    aria-label="Toggle Dark Mode"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="flex-2">
                    <WeatherWidget />
                </div>
            </div>
        </header>
    );
}