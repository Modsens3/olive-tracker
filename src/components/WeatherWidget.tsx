import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeatherData {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
  };
}

interface WeatherWidgetProps {
  lat: number;
  lng: number;
}

export default function WeatherWidget({ lat, lng }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&hourly=temperature_2m,precipitation_probability&forecast_days=1`
        );
        const data = await response.json();
        setWeather(data);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng]);

  if (loading) return (
    <div className="flex items-center gap-2 text-white/80 text-sm p-2">
        <Loader2 className="animate-spin" size={16} />
        <span>Φόρτωση καιρού...</span>
    </div>
  );

  if (error || !weather) return (
    <div className="flex items-center gap-2 text-white/80 text-sm p-2">
        <Cloud size={16} />
        <span>Μη διαθέσιμος καιρός</span>
    </div>
  );

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="text-yellow-300" size={24} />;
    if (code <= 48) return <Cloud className="text-gray-300" size={24} />;
    if (code <= 67) return <CloudRain className="text-blue-300" size={24} />;
    if (code <= 82) return <CloudRain className="text-blue-400" size={24} />;
    return <Cloud className="text-gray-300" size={24} />;
  };

  const current = weather.current;

  return (
    <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-lg p-2 px-3 text-white border border-white/20 dark:border-white/10"
    >
      <div className="flex items-center gap-2">
        {getWeatherIcon(current.weather_code)}
        <div>
            <div className="text-lg font-bold leading-none">{Math.round(current.temperature_2m)}°C</div>
            <div className="text-[10px] opacity-80">Τώρα</div>
        </div>
      </div>

      <div className="h-8 w-px bg-white/20 mx-1 hidden sm:block"></div>

      <div className="hidden sm:flex items-center gap-3 text-xs">
        <div className="flex flex-col items-center gap-0.5" title="Άνεμος">
            <Wind size={14} className="opacity-70" />
            <span>{current.wind_speed_10m} km/h</span>
        </div>
        <div className="flex flex-col items-center gap-0.5" title="Υγρασία">
            <Droplets size={14} className="opacity-70" />
            <span>{current.relative_humidity_2m}%</span>
        </div>
      </div>
    </motion.div>
  );
}
