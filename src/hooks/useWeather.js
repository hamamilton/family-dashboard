import { useState, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind, 
  CloudSun, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle, 
  CloudFog 
} from 'lucide-react';

// WMO Weather interpretation codes
export function getWeatherDetails(code) {
  if (code === 0) return { label: 'Clear Skies', icon: Sun, color: 'text-amber-400' };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: CloudSun, color: 'text-amber-300' };
  if (code === 3) return { label: 'Overcast', icon: Cloud, color: 'text-slate-400' };
  if (code === 45 || code === 48) return { label: 'Foggy', icon: CloudFog, color: 'text-slate-300' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: CloudDrizzle, color: 'text-cyan-400' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: CloudRain, color: 'text-blue-400' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: CloudSnow, color: 'text-white' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-400' };
  return { label: 'Clear Skies', icon: Sun, color: 'text-amber-400' };
}

// Module-level cache so all components share the same fetched data
let cachedWeatherData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn(cachedWeatherData));
}

export function useWeather() {
  const [weatherData, setWeatherData] = useState(cachedWeatherData);
  const [loading, setLoading] = useState(!cachedWeatherData);
  const [error, setError] = useState(null);

  const lat = 40.71;
  const lon = -74.00;

  useEffect(() => {
    const handleUpdate = (data) => setWeatherData(data);
    listeners.add(handleUpdate);

    const fetchWeather = async () => {
      const now = Date.now();
      if (cachedWeatherData && now - lastFetchTime < CACHE_DURATION) {
        setWeatherData(cachedWeatherData);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
        );
        if (!response.ok) throw new Error('Failed to fetch weather');
        const data = await response.json();
        cachedWeatherData = data;
        lastFetchTime = Date.now();
        setWeatherData(data);
        setLoading(false);
        notifyListeners();
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, CACHE_DURATION);

    return () => {
      listeners.delete(handleUpdate);
      clearInterval(interval);
    };
  }, [lat, lon]);

  // Lookup daily forecast for any date (Date object or 'YYYY-MM-DD' string)
  const getDayForecast = (dateInput) => {
    if (!weatherData?.daily?.time) return null;

    let dateKey = '';
    if (typeof dateInput === 'string') {
      dateKey = dateInput.slice(0, 10);
    } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      dateKey = `${y}-${m}-${d}`;
    }

    if (!dateKey) return null;

    const index = weatherData.daily.time.indexOf(dateKey);
    if (index === -1) return null;

    const code = weatherData.daily.weather_code[index];
    const high = Math.round(weatherData.daily.temperature_2m_max[index]);
    const low = Math.round(weatherData.daily.temperature_2m_min[index]);
    const details = getWeatherDetails(code);

    return {
      dateKey,
      high,
      low,
      code,
      label: details.label,
      Icon: details.icon,
      color: details.color
    };
  };

  return {
    weatherData,
    loading,
    error,
    current: weatherData?.current || null,
    daily: weatherData?.daily || null,
    getDayForecast,
    getWeatherDetails
  };
}
