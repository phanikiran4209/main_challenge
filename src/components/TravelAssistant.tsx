import React, { useState } from "react";
import { TravelAdvisory, UserProfile, WeatherData } from "@/types";
import { MapPin, Navigation, Car, AlertOctagon, HelpCircle, Backpack, CheckCircle, Shield } from "lucide-react";

interface TravelAssistantProps {
  profile: UserProfile;
  weather: WeatherData | null;
  geminiKey: string;
}

export default function TravelAssistant({
  profile,
  weather,
  geminiKey,
}: TravelAssistantProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState(profile.vehicle || "car");
  const [departureTime, setDepartureTime] = useState("Immediate");
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      setError("Please specify both origin and destination.");
      return;
    }

    setLoading(true);
    setError("");
    setAdvisory(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiKey) {
        headers["x-gemini-key"] = geminiKey;
      }

      const res = await fetch("/api/travel-advisory", {
        method: "POST",
        headers,
        body: JSON.stringify({
          origin,
          destination,
          departureTime,
          vehicle,
          language: profile.language || "English",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Travel Advisory Evaluation Error:", data.error);
        setError("AI guidance is temporarily unavailable. Weather alerts and emergency contacts remain available.");
        setLoading(false);
        return;
      }

      setAdvisory(data);
    } catch (err: any) {
      console.error("Travel Advisory Evaluation Error:", err);
      setError("AI guidance is temporarily unavailable. Weather alerts and emergency contacts remain available.");
    } finally {
      setLoading(false);
    }
  };

  const getSafetyBadgeStyles = (level: string) => {
    switch (level) {
      case "AVOID":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "CAUTION":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "SAFE":
      default:
        return "bg-green-500/20 text-green-400 border border-green-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Route Inputs */}
      <form onSubmit={handleGetAdvisory} className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-2">
          <Navigation className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">AI Travel Safety Assistant</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Starting Point (Origin)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. Pune, Maharashtra"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="glass-input pl-9 text-sm w-full"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-semibold">Destination</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. Mumbai, Maharashtra"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="glass-input pl-9 text-sm w-full"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">Mode of Travel</label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="glass-input text-sm text-slate-200 bg-zinc-900 border-white/10"
            >
              <option value="none">Public Transport (Train/Bus)</option>
              <option value="two_wheeler">Two-Wheeler (Motorcycle/Scooter)</option>
              <option value="car">Car (Sedan/SUV/Hatchback)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">Departure Time</label>
            <select
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="glass-input text-sm text-slate-200 bg-zinc-900 border-white/10"
            >
              <option value="Immediate">Immediately (Now)</option>
              <option value="2_hours">In 2 Hours</option>
              <option value="6_hours">In 6 Hours</option>
              <option value="tomorrow_morning">Tomorrow Morning</option>
            </select>
          </div>
        </div>

        {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</div>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing Route Weather...
              </>
            ) : (
              <>
                <Car className="w-4 h-4" />
                Check Route Safety
              </>
            )}
          </button>
        </div>
      </form>

      {/* Advisory Result */}
      {advisory && (
        <div className="glass-card p-6 space-y-6 border border-white/15">
          {/* Safety Status Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${getSafetyBadgeStyles(advisory.safety_level)}`}>
                  {advisory.safety_level} ADVISED
                </span>
                <span className="text-slate-400 text-xs font-medium">Weather Advisory</span>
              </div>
              <h3 className="text-lg font-bold text-white">Route Safety Analysis</h3>
            </div>
            <div className="text-xs text-slate-400 italic">
              {origin} → {destination}
            </div>
          </div>

          <p className="text-slate-200 text-sm leading-relaxed font-medium bg-white/5 border border-white/5 p-4 rounded-xl">
            {advisory.reason}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommendations */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Recommended Timing
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                  {advisory.best_time}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" />
                  Alternative Route / Option
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                  {advisory.alternate_route}
                </p>
              </div>
            </div>

            {/* Packing checklist */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Backpack className="w-4 h-4" />
                What to Carry (Trip Essentials)
              </h4>
              <ul className="space-y-1.5">
                {advisory.what_to_carry.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Survival Tips */}
          {advisory.survival_tips && advisory.survival_tips.length > 0 && (
            <div className="border border-white/10 rounded-xl p-4 bg-zinc-950/20">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertOctagon className="w-4.5 h-4.5" />
                Emergency Action (If stranded on route)
              </h4>
              <ul className="space-y-2">
                {advisory.survival_tips.map((tip, idx) => (
                  <li key={idx} className="text-xs md:text-sm text-slate-300 flex items-start gap-2.5">
                    <span className="flex items-center justify-center bg-purple-500/20 text-purple-300 text-[10px] w-5 h-5 rounded-full shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-[10px] text-slate-500 bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-2 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong>Travel Disclaimer:</strong> {advisory.disclaimer || "Advisory details are based on real-time AI weather evaluation. Please prioritize personal judgment and municipal disaster management warnings before embarking on your journey."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
