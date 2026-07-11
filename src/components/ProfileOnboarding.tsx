import React, { useState, useEffect } from "react";
import { UserProfile } from "@/types";
import { Save, User, ShieldAlert, HeartHandshake } from "lucide-react";

interface ProfileOnboardingProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Marathi", label: "मराठी (Marathi)" },
  { value: "Tamil", label: "தமிழ் (Tamil)" },
  { value: "Telugu", label: "తెలుగు (Telugu)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
  { value: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { value: "Malayalam", label: "മലയാളം (Malayalam)" },
];

const MEMBER_OPTIONS = [
  { value: "toddler_child", label: "Toddler / Child" },
  { value: "elderly", label: "Elderly Person" },
  { value: "pregnant", label: "Pregnant Person" },
  { value: "disability", label: "Disabled Person" },
  { value: "pets", label: "Pets" },
];

const HOME_TYPES = [
  { value: "standard_building", label: "Standard Apartment / Flat" },
  { value: "ground_floor", label: "Ground Floor House (Flooding Vulnerable)" },
  { value: "kutcha_house", label: "Kutcha House / Temporary Structure" },
  { value: "coastal_riverside", label: "Coastal / Riverside Area" },
];

const VEHICLE_OPTIONS = [
  { value: "none", label: "No Personal Vehicle (Public Transport/Walk)" },
  { value: "two_wheeler", label: "Two-Wheeler (Motorcycle/Scooter)" },
  { value: "car", label: "Car (Sedan/SUV/Hatchback)" },
];

const ROLES = [
  { value: "citizen", label: "Regular Citizen" },
  { value: "volunteer", label: "Preparedness Volunteer (Can assist others)" },
  { value: "authority", label: "Local Authority / Ward Officer" },
];

export default function ProfileOnboarding({ initialProfile, onSave }: ProfileOnboardingProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [saveStatus, setSaveStatus] = useState<string>("");

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberToggle = (val: string) => {
    setProfile((prev) => {
      const current = prev.members || [];
      const updated = current.includes(val)
        ? current.filter((x) => x !== val)
        : [...current, val];
      return { ...prev, members: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
    setSaveStatus("Profile saved successfully!");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Household Profile & Preferences</h2>
        </div>
        {saveStatus && <span className="text-xs text-green-400 font-semibold">{saveStatus}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name & Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Enter your name"
            className="glass-input text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Primary Contact Phone</label>
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            placeholder="e.g. +91 98765 43210"
            className="glass-input text-sm"
            required
          />
        </div>

        {/* Language & Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Preferred Language</label>
          <select
            name="language"
            value={profile.language}
            onChange={handleChange}
            className="glass-input text-sm text-slate-200 bg-zinc-900 border-white/10"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-zinc-950 text-white">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Community Role</label>
          <select
            name="role"
            value={profile.role}
            onChange={handleChange}
            className="glass-input text-sm text-slate-200 bg-zinc-900 border-white/10"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value} className="bg-zinc-950 text-white">
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Household Vulnerabilities */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Household Members & Vulnerabilities
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {MEMBER_OPTIONS.map((opt) => {
            const isChecked = (profile.members || []).includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleMemberToggle(opt.value)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                  isChecked
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-md"
                    : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Home Type / Floor Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Home Elevation & Location Type</label>
          <select
            name="homeType"
            value={profile.homeType}
            onChange={handleChange}
            className="glass-input text-sm text-slate-200 bg-zinc-900 border-white/10"
          >
            {HOME_TYPES.map((h) => (
              <option key={h.value} value={h.value} className="bg-zinc-950 text-white">
                {h.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Vehicle Ownership</label>
          <select
            name="vehicle"
            value={profile.vehicle}
            onChange={handleChange}
            className="glass-input text-sm text-slate-200 bg-zinc-900 border-white/10"
          >
            {VEHICLE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value} className="bg-zinc-950 text-white">
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Medical Needs, Route, Emergency Contacts */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Medical Needs / Critical Medications</label>
            <input
              type="text"
              name="medicalNeeds"
              value={profile.medicalNeeds}
              onChange={handleChange}
              placeholder="e.g. Asthma inhalers, Insulin, Blood Pressure pills (7-day stock needed)"
              className="glass-input text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Daily Commute Route (for safety alerts)</label>
            <input
              type="text"
              name="commuteRoute"
              value={profile.commuteRoute}
              onChange={handleChange}
              placeholder="e.g. Kurla to Andheri East subway, Mumbai"
              className="glass-input text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Emergency Contacts (ICE) & Notes</label>
          <textarea
            name="emergencyContacts"
            value={profile.emergencyContacts}
            onChange={handleChange}
            placeholder="e.g. Wife: +91 99999 88888, Doctor: +91 88888 77777, Local Ward Shelter: 1916"
            rows={2}
            className="glass-input text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {profile.role === "volunteer" && (
          <div className="flex items-center gap-2 mr-auto bg-green-500/10 border border-green-500/20 rounded-lg py-1.5 px-3 text-xs text-green-400 font-semibold animate-pulse">
            <HeartHandshake className="w-4 h-4" />
            Verified Mitra Volunteer Badge Enabled
          </div>
        )}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Household Profile
        </button>
      </div>
    </form>
  );
}
