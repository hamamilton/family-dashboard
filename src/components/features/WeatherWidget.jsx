import { Wind, Cloud, Sun } from 'lucide-react';
import { useWeather, getWeatherDetails } from '../../hooks/useWeather';

export function WeatherWidget({ compact = false }) {
    const { weatherData, loading, error } = useWeather();

    if (loading) {
        return compact ? (
            <div className="flex items-center gap-2 px-2 py-2 animate-pulse">
                <Sun size={14} className="text-amber-400" />
                <span className="text-xs text-gray-500">Loading...</span>
            </div>
        ) : (
            <div className="flex items-center justify-center bg-white dark:bg-black p-4 border-2 border-slate-300 dark:border-cyan-800 h-[140px] font-mono uppercase w-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                <div className="animate-pulse text-cyan-600 dark:text-cyan-400 text-xs tracking-widest">Acquiring Sat Data...</div>
            </div>
        );
    }

    if (error || !weatherData) {
        return compact ? (
            <div className="flex items-center gap-2 px-2 py-2 text-red-400 text-xs">
                <Cloud size={14} /> Sensor Error
            </div>
        ) : (
            <div className="flex items-center justify-center bg-white dark:bg-black p-4 border-2 border-red-500/50 h-[140px] font-mono uppercase w-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                <div className="text-red-500 text-xs tracking-widest">Sensor Error</div>
            </div>
        );
    }

    const { current, daily } = weatherData;
    const currentDetails = getWeatherDetails(current.weather_code);
    const CurrentIcon = currentDetails.icon;

    // ── Compact sidebar version ──────────────────────────────
    if (compact) {
        return (
            <div className="flex flex-col gap-2 w-full font-mono overflow-hidden">
                {/* Current temp + condition */}
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                        <CurrentIcon size={16} className={currentDetails.color} />
                        <span className="text-base font-black text-white leading-none">
                            {Math.round(current.temperature_2m)}°
                        </span>
                    </div>
                    <div className="text-right leading-none">
                        <div className="text-[9px] text-gray-400 uppercase tracking-wide truncate max-w-[90px]">
                            {currentDetails.label}
                        </div>
                        <div className="flex items-center justify-end gap-0.5 text-[9px] text-gray-500 mt-0.5">
                            <Wind size={8} />{Math.round(current.wind_speed_10m)}mph
                        </div>
                    </div>
                </div>
                {/* Mini 4-day forecast */}
                <div className="flex justify-between pt-1.5 border-t border-white/10">
                    {[1, 2, 3, 4].map(i => {
                        const parts = daily.time[i].split('-');
                        const date = new Date(parts[0], parts[1] - 1, parts[2]);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2).toUpperCase();
                        const det = getWeatherDetails(daily.weather_code[i]);
                        const Icon = det.icon;
                        return (
                            <div key={daily.time[i]} className="flex flex-col items-center gap-0.5">
                                <span className="text-[8px] text-gray-500 font-bold">{dayName}</span>
                                <Icon size={11} className={det.color} />
                                <span className="text-[9px] font-bold text-gray-300">
                                    {Math.round(daily.temperature_2m_max[i])}°
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Full-size version ────────────────────────────────────
    const weeklyForecast = [];
    for (let i = 1; i <= 4; i++) {
        const parts = daily.time[i].split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const details = getWeatherDetails(daily.weather_code[i]);
        const IconComponent = details.icon;
        weeklyForecast.push({
            id: daily.time[i],
            day: dayName,
            dateStr,
            high: Math.round(daily.temperature_2m_max[i]),
            icon: <IconComponent size={14} className={details.color} />,
        });
    }

    return (
        <div
            className="flex flex-col gap-3 bg-white dark:bg-black p-4 border-2 border-slate-300 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all w-full font-mono uppercase"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        >
            <div className="flex items-center justify-between gap-6 border-b border-slate-200 dark:border-cyan-900/50 pb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 border border-slate-500/30 bg-slate-500/10">
                        <CurrentIcon size={28} className={`${currentDetails.color} opacity-80`} />
                    </div>
                    <div>
                        <div className="text-3xl font-black leading-none tracking-tighter text-slate-800 dark:text-white">
                            {Math.round(current.temperature_2m)}°
                        </div>
                        <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-1">
                            {currentDetails.label}
                        </div>
                    </div>
                </div>
                <div className="text-right text-[10px] font-black uppercase tracking-widest leading-loose">
                    <span className="text-fuchsia-500 dark:text-fuchsia-400">High: {Math.round(daily.temperature_2m_max[0])}°</span><br />
                    <span className="text-cyan-700 dark:text-cyan-600">Low: {Math.round(daily.temperature_2m_min[0])}°</span><br />
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-cyan-600 dark:text-cyan-400">
                        <Wind size={10} /> {Math.round(current.wind_speed_10m)}mph
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between pt-1 px-1">
                {weeklyForecast.map((day) => (
                    <div key={day.id} className="flex flex-col items-center gap-1.5">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-widest leading-none">{day.day}</span>
                            <span className="text-[8px] font-bold text-slate-400/70 dark:text-slate-500/70 leading-none mt-1">{day.dateStr}</span>
                        </div>
                        {day.icon}
                        <span className="text-[11px] font-bold text-slate-700 dark:text-white">{day.high}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
}