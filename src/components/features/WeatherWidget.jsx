import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind, CloudSun, CloudSnow, CloudLightning, CloudDrizzle, CloudFog } from 'lucide-react';

// WMO Weather interpretation codes
function getWeatherDetails(code) {
    if (code === 0) return { label: 'Clear Skies', icon: Sun, color: 'text-amber-400', bg: 'text-amber-400' };
    if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: CloudSun, color: 'text-amber-300', bg: 'text-amber-300' };
    if (code === 3) return { label: 'Overcast', icon: Cloud, color: 'text-slate-400', bg: 'text-slate-400' };
    if (code === 45 || code === 48) return { label: 'Foggy', icon: CloudFog, color: 'text-slate-300', bg: 'text-slate-300' };
    if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: CloudDrizzle, color: 'text-cyan-400', bg: 'text-cyan-400' };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: CloudRain, color: 'text-blue-400', bg: 'text-blue-400' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: CloudSnow, color: 'text-white', bg: 'text-white' };
    if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-400', bg: 'text-purple-400' };
    return { label: 'Unknown', icon: Cloud, color: 'text-slate-400', bg: 'text-slate-400' };
}

export function WeatherWidget() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Default to New York City
    const lat = 40.71;
    const lon = -74.00;

    useEffect(() => {
        async function fetchWeather() {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
                );
                if (!response.ok) throw new Error('Failed to fetch weather');
                const data = await response.json();
                setWeatherData(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchWeather();
        // Refresh every 30 mins
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [lat, lon]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-black p-4 border-2 border-slate-300 dark:border-cyan-800 w-full max-w-xs font-mono uppercase h-[140px]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                <div className="animate-pulse text-cyan-600 dark:text-cyan-400 text-xs tracking-widest">Acquiring Sat Data...</div>
            </div>
        );
    }

    if (error || !weatherData) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-black p-4 border-2 border-red-500/50 w-full max-w-xs font-mono uppercase h-[140px]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                <div className="text-red-500 text-xs tracking-widest">Sensor Error</div>
            </div>
        );
    }

    const { current, daily } = weatherData;
    const currentDetails = getWeatherDetails(current.weather_code);
    const CurrentIcon = currentDetails.icon;

    // Build next 4 days forecast
    const weeklyForecast = [];
    for (let i = 1; i <= 4; i++) {
        // Parse "YYYY-MM-DD" safely as local date to prevent timezone off-by-one errors
        const parts = daily.time[i].split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const details = getWeatherDetails(daily.weather_code[i]);
        const IconComponent = details.icon;
        weeklyForecast.push({
            id: daily.time[i],
            day: dayName,
            dateStr: dateStr,
            high: Math.round(daily.temperature_2m_max[i]),
            icon: <IconComponent size={14} className={details.color} />
        });
    }

    return (
        <div
            className="flex flex-col gap-3 bg-white dark:bg-black p-4 border-2 border-slate-300 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-400 shadow-sm hover:shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.15)] dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all w-full max-w-xs font-mono uppercase"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        >
            <div className="flex items-center justify-between gap-6 border-b border-slate-200 dark:border-cyan-900/50 pb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 border border-slate-500/30 bg-slate-500/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]`}>
                        <CurrentIcon size={28} className={`${currentDetails.bg} opacity-80`} />
                    </div>
                    <div>
                        <div className="text-3xl font-black leading-none tracking-tighter text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            {Math.round(current.temperature_2m)}°
                        </div>
                        <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mt-1">
                            {currentDetails.label}
                        </div>
                    </div>
                </div>

                <div className="text-right text-[10px] font-black text-fuchsia-600 dark:text-fuchsia-500 uppercase tracking-widest leading-loose">
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
                            <span className="text-[8px] font-bold text-slate-400/70 dark:text-slate-500/70 tracking-widest leading-none mt-1">{day.dateStr}</span>
                        </div>
                        {day.icon}
                        <span className="text-[11px] font-bold text-slate-700 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{day.high}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
}