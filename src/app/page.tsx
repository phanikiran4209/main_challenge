"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, WeatherData, PreparednessPlan } from "@/types";
import RiskCard from "@/components/RiskCard";
import ReadinessScore from "@/components/ReadinessScore";
import ProfileOnboarding from "@/components/ProfileOnboarding";
import TravelAssistant from "@/components/TravelAssistant";
import VoiceChat from "@/components/VoiceChat";
import EmergencyPanel from "@/components/EmergencyPanel";
import {
  ShieldAlert,
  Settings,
  HeartHandshake,
  Activity,
  AlertOctagon,
  Sparkles,
  MapPin,
  RefreshCw,
  BookOpen,
  Calendar,
  CloudLightning,
  AlertTriangle
} from "lucide-react";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  phone: "",
  language: "English",
  members: [],
  homeType: "apartment",
  floor: "Above 2nd Floor",
  vehicle: "none",
  commuteRoute: "",
  emergencyContacts: "",
  medicalNeeds: "",
  role: "citizen",
  readinessCheckedItems: [],
};

const DEFAULT_WEATHER: WeatherData = {
  location: "Awaiting location synchronization...",
  coordinates: { lat: 19.0760, lon: 72.8777 },
  current: {
    temp: 0,
    humidity: 0,
    feels_like: 0,
    rain: 0,
    wind: 0,
    weather_code: 0,
    description: "No weather data loaded.",
    category: "dry",
  },
  risk: {
    level: "GREEN",
    reason: "Awaiting city search or GPS detection to compute threat levels.",
  },
  forecast: [],
};

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
  const [customKey, setCustomKey] = useState("");
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // AI Plan states
  const [plan, setPlan] = useState<PreparednessPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");

  // Tabs state
  const [activeTab, setActiveTab] = useState<"prepare" | "travel" | "chat" | "emergency">("prepare");
  const [planPhase, setPlanPhase] = useState<"before" | "during" | "after">("before");

  // Load configuration from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("mitra_profile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      const savedKey = localStorage.getItem("mitra_gemini_key") || "";
      if (savedKey) {
        setCustomKey(savedKey);
      }
    }
    // Fetch initial weather for default city (Mumbai)
    fetchWeatherData("Mumbai");
  }, []);

  const fetchWeatherData = async (city?: string | null, lat?: number, lon?: number) => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      let query = "";
      if (city) {
        query = `?city=${encodeURIComponent(city)}`;
      } else if (lat !== undefined && lon !== undefined) {
        query = `?lat=${lat}&lon=${lon}`;
      }

      const res = await fetch(`/api/weather${query}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve weather data.");
      }

      setWeather(data);
    } catch (err: any) {
      console.error(err);
      setWeatherError(err.message || "Weather fetch failed.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      fetchWeatherData(cityInput.trim());
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      setWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await fetchWeatherData(null, latitude, longitude);
        },
        (err) => {
          console.error(err);
          setWeatherError("GPS access denied. Enter city manually.");
          setWeatherLoading(false);
        }
      );
    } else {
      setWeatherError("Geolocation not supported by this browser.");
    }
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem("mitra_profile", JSON.stringify(updatedProfile));
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mitra_gemini_key", customKey);
    setShowKeyConfig(false);
  };

  const handleReadinessChange = (checkedIds: string[]) => {
    const updated = { ...profile, readinessCheckedItems: checkedIds };
    setProfile(updated);
    localStorage.setItem("mitra_profile", JSON.stringify(updated));
  };

  // Generate Personalized AI Preparedness Plan
  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    setPlanError("");
    setPlan(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (customKey) {
        headers["x-gemini-key"] = customKey;
      }

      const res = await fetch("/api/plan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          profile,
          weather,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Preparedness Plan Generation Error:", data.error);
        setPlanError("AI guidance is temporarily unavailable. Weather alerts and emergency contacts remain available.");
        setPlanLoading(false);
        return;
      }

      setPlan(data);
    } catch (err: any) {
      console.error("Preparedness Plan Generation Error:", err);
      setPlanError("AI guidance is temporarily unavailable. Weather alerts and emergency contacts remain available.");
    } finally {
      setPlanLoading(false);
    }
  };

  // Automatically refresh AI Plan when weather location changes
  useEffect(() => {
    if (weather.location && weather.location !== "Awaiting location synchronization...") {
      handleGeneratePlan();
    }
  }, [weather.location]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/10 py-4 px-6 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <CloudLightning className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Monsoon Mitra
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                  AI Companion
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Know the risk. Take the right action. Stay safe together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick SOS Mode Toggle in Header */}
            <button
              onClick={() => {
                setActiveTab("emergency");
              }}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition shadow-md shadow-red-600/20 cursor-pointer animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              SOS EMERGENCY HUB
            </button>

            {/* Custom Gemini Key Trigger */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                customKey
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Configure API Keys"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* API Key Modal Drawer */}
        {showKeyConfig && (
          <div className="max-w-7xl mx-auto mt-4 p-4 glass-card bg-zinc-900 border border-white/10">
            <form onSubmit={handleSaveKey} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-bold">Gemini API Key (stored in browser session)</label>
                <input
                  type="password"
                  placeholder="Paste your AI Studio API Key (starts with AIzaSy)..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="glass-input text-xs w-full"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer shrink-0"
              >
                Save API Key
              </button>
            </form>
            <p className="text-[10px] text-slate-500 mt-2">
              *If left blank, the app will try to read the server-side <code>GEMINI_API_KEY</code> from <code>.env.local</code>.
            </p>
          </div>
        )}
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Weather Status and Readiness Score (5 columns on desktop) */}
        <section className="lg:col-span-5 space-y-6">
          {/* Geolocation Search Box */}
          <div className="glass-card p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Dashboard Location</h3>
            <div className="flex gap-2">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search city (e.g. Pune, Chennai)"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="glass-input text-xs flex-1 py-1.5"
                />
                <button
                  type="submit"
                  disabled={weatherLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer"
                >
                  {weatherLoading ? "Searching..." : "Search"}
                </button>
              </form>
              <button
                onClick={handleDetectLocation}
                disabled={weatherLoading}
                className="bg-white/5 border border-white/10 hover:bg-white/10 p-2 rounded-lg text-slate-300 transition cursor-pointer"
                title="Detect GPS Location"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
            {weatherError && <div className="text-[10px] text-red-400">{weatherError}</div>}
          </div>

          {/* Weather Risk Card */}
          <RiskCard weather={weather} onRefresh={() => fetchWeatherData(weather.location.split(",")[0])} loading={weatherLoading} />

          {/* Personal Readiness Score */}
          <ReadinessScore checkedIds={profile.readinessCheckedItems || []} onChange={handleReadinessChange} />

        </section>

        {/* Right Side: Navigation Tabs and Actions (7 columns on desktop) */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Main Action Tabs */}
          <div className="flex bg-zinc-950/40 border border-white/10 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab("prepare")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "prepare" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              AI Prep Planner
            </button>
            <button
              onClick={() => setActiveTab("travel")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "travel" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Travel Safety
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "chat" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Mitra Voice Assistant
            </button>
            <button
              onClick={() => setActiveTab("emergency")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "emergency" ? "bg-red-600/30 text-red-400 font-bold border border-red-500/20" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Emergency Hub
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1">
            {activeTab === "prepare" && (
              <div className="space-y-6">
                {/* Profile Configuration */}
                <ProfileOnboarding initialProfile={profile} onSave={handleSaveProfile} />

                {/* AI Plan Generator Trigger */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-white text-base">Generate Personalized AI Safety Plan</h3>
                    </div>
                    <button
                      onClick={handleGeneratePlan}
                      disabled={planLoading}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {planLoading ? "Generating..." : "Generate Plan"}
                    </button>
                  </div>

                  {planError && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-lg flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{planError}</div>
                    </div>
                  )}

                  {planLoading && (
                    <div className="flex flex-col justify-center items-center py-10 space-y-3">
                      <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <div className="text-xs text-slate-400 font-medium">Gemini is analyzing your vulnerability profile and weather...</div>
                    </div>
                  )}

                  {/* Render the AI-generated plan */}
                  {plan && (
                    <div className="space-y-6">
                      <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl space-y-1">
                        <div className="text-[10px] text-blue-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 animate-pulse" /> Threat Summary
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed font-semibold">
                          {plan.summary}
                        </p>
                      </div>

                      {/* Phase Navigation */}
                      <div className="flex gap-2 border-b border-white/5 pb-2">
                        <button
                          onClick={() => setPlanPhase("before")}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition cursor-pointer ${
                            planPhase === "before"
                              ? "bg-blue-500/25 text-blue-400 border border-blue-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Before (Do Now)
                        </button>
                        <button
                          onClick={() => setPlanPhase("during")}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition cursor-pointer ${
                            planPhase === "during"
                              ? "bg-red-500/20 text-red-400 border border-red-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          During Warning
                        </button>
                        <button
                          onClick={() => setPlanPhase("after")}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition cursor-pointer ${
                            planPhase === "after"
                              ? "bg-teal-500/20 text-teal-400 border border-teal-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          After Recovery
                        </button>
                      </div>

                      {/* Phase Content Display */}
                      <div className="space-y-4">
                        {planPhase === "before" && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Immediate Do Now</h4>
                              <ul className="space-y-1.5">
                                {plan.do_now.map((item, idx) => (
                                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vulnerability Packing Check</h4>
                              <ul className="space-y-1.5">
                                {plan.emergency_kit.map((item, idx) => (
                                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                                    <span className="text-amber-500 mt-0.5">✔</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {planPhase === "during" && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Things to Avoid</h4>
                              <ul className="space-y-1.5">
                                {plan.avoid.map((item, idx) => (
                                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                                    <span className="text-red-500 mt-0.5">🚷</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Family Precautions</h4>
                              <ul className="space-y-1.5">
                                {plan.family_precautions.map((item, idx) => (
                                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                                    <span className="text-blue-400 mt-0.5">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="border border-red-500/20 bg-red-950/20 rounded-xl p-4 mt-3">
                              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Emergency Mode Action
                              </h4>
                              <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-semibold">
                                {plan.emergency_action}
                              </p>
                            </div>
                          </div>
                        )}

                        {planPhase === "after" && (
                          <div>
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Recovery & Sanitation Checks</h4>
                            <ul className="space-y-2">
                              {plan.recovery_actions.map((item, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                                  <span className="text-teal-500 mt-0.5">✓</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "travel" && (
              <TravelAssistant
                profile={profile}
                weather={weather}
                geminiKey={customKey}
              />
            )}

            {activeTab === "chat" && (
              <VoiceChat
                profile={profile}
                weather={weather}
                geminiKey={customKey}
              />
            )}

            {activeTab === "emergency" && (
              <EmergencyPanel profile={profile} weather={weather} />
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500 mt-auto bg-zinc-950/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© {new Date().getFullYear()} Monsoon Mitra safety companion app. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-blue-500" />
            Empowering communities to stay safe.
          </span>
        </div>
      </footer>
    </div>
  );
}
