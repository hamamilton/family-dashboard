import { useWeather } from '../../hooks/useWeather';

export function WeatherDayBadge({ date, forecast: directForecast, compact = false, className = '' }) {
  const { getDayForecast } = useWeather();
  const forecast = directForecast || (date ? getDayForecast(date) : null);

  if (!forecast) return null;

  const { Icon, color, high, low, label } = forecast;

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 dark:bg-slate-900/90 border border-slate-700/60 dark:border-cyan-900/40 text-[10px] font-mono tracking-tight shadow-sm ${className}`}
        title={`${label}: High ${high}° / Low ${low}°`}
      >
        <Icon size={12} className={`${color} shrink-0`} />
        <span className="font-bold text-slate-200 dark:text-slate-100 leading-none">{high}°</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 dark:bg-slate-900/90 border border-slate-700/60 dark:border-cyan-900/40 text-xs font-mono shadow-sm ${className}`}
      title={`${label}: High ${high}° / Low ${low}°`}
    >
      <Icon size={14} className={`${color} shrink-0`} />
      <span className="font-black text-slate-200 dark:text-slate-100 leading-none">{high}°</span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 leading-none">/ {low}°</span>
      <span className="hidden xl:inline text-[9px] uppercase tracking-wider text-slate-400/80 font-bold ml-0.5 truncate max-w-[70px]">
        {label}
      </span>
    </div>
  );
}
