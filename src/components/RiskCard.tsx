import React from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  AlertTriangle,
  ShieldAlert,
  Info,
  Navigation
} from "lucide-react";
import { WeatherData } from "@/types";

interface RiskCardProps {
  weather: WeatherData;
  onRefresh: () => void;
  loading: boolean;
}

export default function RiskCard({ weather, onRefresh, loading }: RiskCardProps) {
  const { current, risk, location } = weather;

  const getRiskStyles = (level: string) => {
    switch (level) {
      case "RED":
        return {
          bg: "bg-red-950/40 border-red-500/30 text-red-400",
          glow: "glow-red",
          badge: "bg-red-500 text-white animate-pulse",
          icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
        };
      case "ORANGE":
        return {
          bg: "bg-orange-950/40 border-orange-500/30 text-orange-400",
          glow: "glow-orange",
          badge: "bg-orange-500 text-white",
          icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
        };
      case "YELLOW":
        return {
          bg: "bg-yellow-950/30 border-yellow-500/20 text-yellow-300",
          glow: "glow-yellow",
          badge: "bg-yellow-500 text-zinc-950 font-semibold",
          icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
        };
      case "GREEN":
      default:
        return {
          bg: "bg-green-950/20 border-green-500/20 text-green-400",
          glow: "glow-green",
          badge: "bg-green-500 text-zinc-950 font-semibold",
          icon: <Sun className="w-8 h-8 text-green-500" />,
        };
    }
  };

  const getWeatherIcon = (category: string) => {
    const size = "w-10 h-10";
    switch (category) {
      case "thunderstorm":
      case "thunderstorm_hail":
        return <CloudLightning className={`${size} text-purple-400`} />;
      case "rain_heavy":
      case "rain_moderate":
        return <CloudRain className={`${size} text-blue-400`} />;
      case "rain_light":
      case "drizzle":
        return <CloudRain className={`${size} text-sky-400`} />;
      case "fog":
        return <Cloud className={`${size} text-zinc-400`} />;
      case "clear":
        return <Sun className={`${size} text-yellow-400`} />;
      case "cloudy":
      default:
        return <Cloud className={`${size} text-zinc-300`} />;
    }
  };

  const styles = getRiskStyles(risk.level);

  return (
    <div className={`glass-card p-6 ${styles.glow} flex flex-col justify-between h-full`}>
      <div>
        {/* Header with location and refresh */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 max-w-[70%]">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="font-semibold text-lg text-white truncate" title={location}>
              {location}
            </h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 text-slate-200 py-1.5 px-3 rounded-md transition disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {loading ? "Updating..." : "Refresh Local Weather"}
          </button>
        </div>

        {/* Temperature & main description */}
        <div className="flex items-center gap-4 mb-6">
          <div className="shrink-0 p-3 bg-white/5 rounded-xl">
            {getWeatherIcon(current.category)}
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white flex items-baseline">
              {current.temp.toFixed(1)}
              <span className="text-xl font-normal text-slate-400 ml-1">°C</span>
            </div>
            <div className="text-slate-300 font-medium capitalize">{current.description}</div>
          </div>
        </div>

        {/* Risk Badge and Explanation */}
        <div className={`border rounded-xl p-4 mb-6 ${styles.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            {styles.icon}
            <div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${styles.badge}`}>
                {risk.level} RISK
              </span>
              <h3 className="font-bold text-white mt-1">Live Risk Radar Warning</h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed">{risk.reason}</p>
        </div>

        {/* Weather Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <CloudRain className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-slate-400">Precipitation</div>
              <div className="font-bold text-white">{current.rain.toFixed(1)} mm</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <Wind className="w-5 h-5 text-teal-400" />
            <div>
              <div className="text-xs text-slate-400">Wind Speed</div>
              <div className="font-bold text-white">{current.wind.toFixed(1)} km/h</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <Droplets className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs text-slate-400">Humidity</div>
              <div className="font-bold text-white">{current.humidity}%</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400">Feels Like</div>
              <div className="font-bold text-white">{current.feels_like.toFixed(1)} °C</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 mt-4 italic text-center">
        *AI-assisted guidance; always follow local disaster authorities and emergency protocols.
      </div>
    </div>
  );
}
