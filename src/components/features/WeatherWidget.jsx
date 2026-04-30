import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';

export function WeatherWidget() {
    const weeklyForecast = [
        { id: 'thu', day: 'THU', high: 62, icon: <Cloud size={14} className="text-cyan-500" /> },
        { id: 'fri', day: 'FRI', high: 55, icon: <CloudRain size={14} className="text-fuchsia-400" /> },
        { id: 'sat', day: 'SAT', high: 68, icon: <Sun size={14} className="text-amber-400" /> },
        { id: 'sun', day: 'SUN', high: 71, icon: <Sun size={14} className="text-amber-400" /> },
    ];

    return (
        <div
            className="flex flex-col gap-3 bg-white dark:bg-black p-4 border-2 border-slate-300 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-400 shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.15)] dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all w-full max-w-xs font-mono uppercase"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        >
            <div className="flex items-center justify-between gap-6 border-b border-slate-200 dark:border-cyan-900/50 pb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <Sun size={28} className="fill-amber-400/20 animate-[spin_60s_linear_infinite]" />
                    </div>
                    <div>
                        <div className="text-3xl font-black leading-none tracking-tighter text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">54°</div>
                        <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-1">Clear Skies</div>
                    </div>
                </div>

                <div className="text-right text-[10px] font-black text-fuchsia-600 dark:text-fuchsia-500 uppercase tracking-widest leading-loose">
                    <span className="text-fuchsia-500 dark:text-fuchsia-400">High: 59°</span><br />
                    <span className="text-cyan-700 dark:text-cyan-600">Low: 39°</span><br />
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-cyan-600 dark:text-cyan-400">
                        <Wind size={10} /> 8mph
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-1 px-1">
                {weeklyForecast.map((day) => (
                    <div key={day.id} className="flex flex-col items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-widest">{day.day}</span>
                        {day.icon}
                        <span className="text-[11px] font-bold text-slate-700 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{day.high}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
}