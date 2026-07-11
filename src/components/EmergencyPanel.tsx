import React, { useState, useEffect } from "react";
import { UserProfile, WeatherData } from "@/types";
import {
  AlertTriangle,
  Phone,
  Share2,
  CheckSquare,
  Home,
  MapPin,
  PlusCircle,
  Users,
  AlertCircle,
  BadgeAlert,
  Heart
} from "lucide-react";

interface EmergencyPanelProps {
  profile: UserProfile;
  weather: WeatherData | null;
}

interface IncidentReport {
  id: number;
  category: "waterlogging" | "fallen_tree" | "road_block" | "power_outage";
  description: string;
  location: string;
  reporter: string;
  verified: boolean;
  timestamp: string;
}

interface HelpRequest {
  id: number;
  category: "food" | "water" | "charging" | "first_aid" | "transport";
  urgency: "high" | "medium" | "low";
  location: string;
  details: string;
  requester: string;
  status: "open" | "assigned" | "completed";
  assignedVolunteer?: string;
}

// Predefined mock shelters by region
const MOCK_SHELTERS: Record<string, Array<{ name: string; capacity: string; phone: string; address: string }>> = {
  mumbai: [
    { name: "Dharavi Municipal School Shelter", capacity: "300 people", phone: "022-24071234", address: "90 Feet Road, Dharavi, Mumbai" },
    { name: "Chembur Community Center", capacity: "150 people", phone: "022-25554321", address: "VN Purav Marg, Chembur, Mumbai" },
    { name: "Andheri East Ward Sports Complex", capacity: "500 people", phone: "022-26829999", address: "Telli Galli, Andheri East, Mumbai" },
  ],
  pune: [
    { name: "Shivaji Nagar Multi-purpose Hall", capacity: "200 people", phone: "020-25531111", address: "Jangali Maharaj Road, Shivaji Nagar, Pune" },
    { name: "Kothrud Ward Disaster Relief Camp", capacity: "120 people", phone: "020-25382222", address: "Paud Road, Kothrud, Pune" },
  ],
  chennai: [
    { name: "Mylapore Community Relief Center", capacity: "250 people", phone: "044-24643333", address: "Kutchery Road, Mylapore, Chennai" },
    { name: "Velachery Flood Rescue Camp", capacity: "400 people", phone: "044-22445555", address: "Taramani Link Road, Velachery, Chennai" },
  ],
};

const EMERGENCY_HELPLINES = [
  { name: "National Emergency Helpline", number: "112" },
  { name: "NDRF Fire & Disaster Control", number: "108" },
  { name: "Police Control Room", number: "100" },
  { name: "Municipal Helpline (Mumbai/State)", number: "1916" },
];

export default function EmergencyPanel({ profile, weather }: EmergencyPanelProps) {
  const [sosActive, setSosActive] = useState(false);
  const [offlineChecks, setOfflineChecks] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);

  // Form states
  const [newIncident, setNewIncident] = useState({ category: "waterlogging", description: "", location: "" });
  const [newHelp, setNewHelp] = useState({ category: "food", urgency: "medium", location: "", details: "" });

  const [activeTab, setActiveTab] = useState<"helplines" | "shelters" | "incidents" | "volunteer">("helplines");

  // Load offline checks state on startup
  useEffect(() => {
    const saved = localStorage.getItem("mitra_offline_checks");
    if (saved) {
      setOfflineChecks(JSON.parse(saved));
    }
  }, []);

  const handleOfflineToggle = (id: string) => {
    const updated = offlineChecks.includes(id)
      ? offlineChecks.filter((x) => x !== id)
      : [...offlineChecks, id];
    setOfflineChecks(updated);
    localStorage.setItem("mitra_offline_checks", JSON.stringify(updated));
  };

  const triggerSOS = () => {
    setSosActive(!sosActive);
  };

  // Generate WhatsApp status message share link
  const getWhatsAppShareLink = () => {
    const loc = weather?.location || "My Location";
    const level = weather?.risk?.level || "YELLOW";
    const rain = weather?.current?.rain || 0;
    const temp = weather?.current?.temp || 0;

    const message = `🚨 MONSOON MITRA EMERGENCY ALERT! 🚨\nI am currently in ${loc}. Current Weather: ${temp}°C, rain is ${rain}mm, Risk Level: ${level}.\nMy coordinates: ${weather?.coordinates?.lat.toFixed(4) || ""}, ${weather?.coordinates?.lon.toFixed(4) || ""}.\nMy status: ${sosActive ? "I NEED ASSISTANCE / HELP!" : "I am safe, but preparing for severe weather."}\nGenerated via Monsoon Mitra App.`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  const getSMSShareLink = () => {
    const loc = weather?.location || "My Location";
    const level = weather?.risk?.level || "YELLOW";
    const message = `Monsoon Mitra Alert: I am in ${loc}. Risk: ${level}. Status: ${sosActive ? "NEED HELP!" : "Prepared and safe."}`;
    return `sms:${profile.phone || ""}?body=${encodeURIComponent(message)}`;
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.description || !newIncident.location) return;

    const report: IncidentReport = {
      id: Date.now(),
      category: newIncident.category as any,
      description: newIncident.description,
      location: newIncident.location,
      reporter: profile.name || "Citizen",
      verified: false, // Citizen reports are UNVERIFIED by default
      timestamp: "Just now",
    };

    setIncidents([report, ...incidents]);
    setNewIncident({ category: "waterlogging", description: "", location: "" });
  };

  const handleAddHelpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHelp.details || !newHelp.location) return;

    const req: HelpRequest = {
      id: Date.now(),
      category: newHelp.category as any,
      urgency: newHelp.urgency as any,
      location: newHelp.location,
      details: newHelp.details,
      requester: profile.name || "Citizen",
      status: "open",
    };

    setHelpRequests([req, ...helpRequests]);
    setNewHelp({ category: "food", urgency: "medium", location: "", details: "" });
  };

  const handleAcceptRequest = (id: number) => {
    setHelpRequests(
      helpRequests.map((req) => {
        if (req.id === id) {
          return {
            ...req,
            status: "assigned",
            assignedVolunteer: profile.name || "Mitra Volunteer",
          };
        }
        return req;
      })
    );
  };

  const handleCompleteRequest = (id: number) => {
    setHelpRequests(
      helpRequests.map((req) => {
        if (req.id === id) {
          return { ...req, status: "completed" };
        }
        return req;
      })
    );
  };

  // Get Shelters list based on location
  const getLocalShelters = () => {
    const locLower = (weather?.location || "").toLowerCase();
    if (locLower.includes("pune")) return MOCK_SHELTERS.pune;
    if (locLower.includes("chennai")) return MOCK_SHELTERS.chennai;
    return MOCK_SHELTERS.mumbai; // default to mumbai
  };

  const shelters = getLocalShelters();

  return (
    <div className={`space-y-6 transition duration-500 ${sosActive ? "ring-4 ring-red-600/50 rounded-2xl" : ""}`}>
      {/* SOS Button Header */}
      <div className={`glass-card p-6 flex flex-col items-center justify-center text-center ${sosActive ? "bg-red-950/20 border-red-500/30" : ""}`}>
        <button
          onClick={triggerSOS}
          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center font-extrabold text-lg transition duration-300 shadow-xl cursor-pointer ${
            sosActive
              ? "bg-zinc-950 text-red-500 border-4 border-red-500 shadow-red-500/30 animate-pulse"
              : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 active:scale-95"
          }`}
        >
          <AlertTriangle className="w-8 h-8 mb-1" />
          <span>{sosActive ? "SOS ACTIVE" : "SOS HELP"}</span>
        </button>

        <h3 className="font-extrabold text-white text-lg mt-4">
          {sosActive ? "Emergency Mode Active" : "Need Emergency Assistance?"}
        </h3>
        <p className="text-xs md:text-sm text-slate-300 max-w-md mt-1.5 leading-relaxed">
          {sosActive
            ? "Your SOS is active. Broadcast your status or contact local emergency dispatch. Keep your battery saved."
            : "Trigger Emergency Mode to reveal offline safety checks, broadcast your live GPS status to family, or request community help."}
        </p>

        {/* SOS Action Triggers */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5 w-full max-w-md">
          <a
            href={getWhatsAppShareLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share WhatsApp Status
          </a>
          <a
            href={getSMSShareLink()}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            SMS Location Status
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {(["helplines", "shelters", "incidents", "volunteer"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs md:text-sm font-semibold capitalize border-b-2 transition cursor-pointer ${
              activeTab === tab
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panel Contents */}
      <div className="space-y-6">
        {/* TAB 1: Helplines */}
        {activeTab === "helplines" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                <Phone className="w-4.5 h-4.5 text-red-400" />
                Emergency Helpline Contacts
              </h3>
              <div className="space-y-3">
                {EMERGENCY_HELPLINES.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <div>
                      <div className="font-bold text-sm text-white">{line.name}</div>
                      <div className="text-xs text-red-400 font-bold font-mono">{line.number}</div>
                    </div>
                    <a
                      href={`tel:${line.number}`}
                      className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white p-2.5 rounded-lg border border-red-500/20 transition cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline checks */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                <CheckSquare className="w-4.5 h-4.5 text-blue-400" />
                Offline Emergency Checklist
              </h3>
              <p className="text-[11px] text-slate-400">
                Checklist is stored locally and stays active without internet. Use in case of network outages.
              </p>
              <div className="space-y-2">
                {[
                  { id: "power", label: "Turn off main electricity switch if water enters home" },
                  { id: "gas", label: "Turn off LPG cylinder / pipe valves" },
                  { id: "charge", label: "Set phone to power saver mode immediately" },
                  { id: "water", label: "Fill containers with drinking water before supply fails" },
                  { id: "meds", label: "Keep critical pills in pocket or waterproof pouch" },
                ].map((item) => {
                  const checked = offlineChecks.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => handleOfflineToggle(item.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer select-none text-xs ${
                        checked
                          ? "bg-blue-600/10 border-blue-500/20 text-blue-300"
                          : "bg-white/5 border-white/5 text-slate-300"
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="sr-only" />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          checked ? "bg-blue-500 border-blue-400 text-white" : "border-slate-500"
                        }`}
                      >
                        {checked && "✓"}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Shelters */}
        {activeTab === "shelters" && (
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Home className="w-4.5 h-4.5 text-green-400" />
                Nearby Rescue Shelters ({weather?.location ? weather.location.split(",")[0] : "Mumbai"})
              </h3>
            </div>
            <div className="space-y-4">
              {shelters.map((shelter, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{shelter.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {shelter.address}
                    </p>
                    <span className="inline-block text-[10px] bg-green-500/10 text-green-400 border border-green-500/25 px-2.5 py-0.5 rounded font-semibold mt-1">
                      Available capacity: {shelter.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${shelter.phone}`}
                      className="bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Shelter
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Incidents */}
        {activeTab === "incidents" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form */}
            <div className="glass-card p-6 space-y-4 h-fit md:col-span-1">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                <PlusCircle className="w-4.5 h-4.5 text-blue-400" />
                Report Hazard / Incident
              </h3>
              <form onSubmit={handleAddIncident} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Incident Type</label>
                  <select
                    value={newIncident.category}
                    onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                    className="glass-input text-xs text-slate-200 bg-zinc-900 border-white/10 py-2"
                  >
                    <option value="waterlogging">Waterlogging / Flooding</option>
                    <option value="fallen_tree">Fallen Tree / Blocked Lane</option>
                    <option value="road_block">Bridge / Subway Closure</option>
                    <option value="power_outage">Power Infrastructure Hazard</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Specific Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Linking road intersection, Bandra"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                    className="glass-input text-xs py-2"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Incident Details</label>
                  <textarea
                    placeholder="Provide details of water depth, severity, or active danger."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    className="glass-input text-xs resize-none py-2"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  Submit Citizen Report
                </button>
              </form>
            </div>

            {/* List */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-bold text-white text-sm">Community Hazard Reports Feed</h3>
                <span className="text-[10px] text-slate-400">Total: {incidents.length} reports</span>
              </div>

              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div key={inc.id} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                          {inc.category.replace("_", " ")}
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1.5">{inc.location}</h4>
                      </div>
                      {inc.verified ? (
                        <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 shrink-0">
                          <AlertCircle className="w-3 h-3" /> OFFICIAL VERIFIED
                        </span>
                      ) : (
                        <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 shrink-0">
                          <BadgeAlert className="w-3 h-3" /> CITIZEN REPORT (UNVERIFIED)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-white/5 pt-2 mt-2">
                      <span>Reporter: {inc.reporter}</span>
                      <span>{inc.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Volunteer Support */}
        {activeTab === "volunteer" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form */}
            <div className="glass-card p-6 space-y-4 h-fit md:col-span-1">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                <Heart className="w-4.5 h-4.5 text-red-400" />
                Request Non-Emergency Help
              </h3>
              <form onSubmit={handleAddHelpRequest} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Help Category</label>
                  <select
                    value={newHelp.category}
                    onChange={(e) => setNewHelp({ ...newHelp, category: e.target.value })}
                    className="glass-input text-xs text-slate-200 bg-zinc-900 border-white/10 py-2"
                  >
                    <option value="food">Food / Drinking Water</option>
                    <option value="charging">Power Outlet / Device Charging</option>
                    <option value="first_aid">First Aid Kits / Medicines</option>
                    <option value="transport">Evacuation / Boat Transport</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Urgency Level</label>
                  <select
                    value={newHelp.urgency}
                    onChange={(e) => setNewHelp({ ...newHelp, urgency: e.target.value })}
                    className="glass-input text-xs text-slate-200 bg-zinc-900 border-white/10 py-2"
                  >
                    <option value="low">Low (Next 24 hours)</option>
                    <option value="medium">Medium (Next 4 hours)</option>
                    <option value="high">High (Immediate Help Needed)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Approximate Area / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Sion West, near Station"
                    value={newHelp.location}
                    onChange={(e) => setNewHelp({ ...newHelp, location: e.target.value })}
                    className="glass-input text-xs py-2"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-semibold">Details & Instructions</label>
                  <textarea
                    placeholder="Enter details (number of people, power status, specific contact)."
                    value={newHelp.details}
                    onChange={(e) => setNewHelp({ ...newHelp, details: e.target.value })}
                    className="glass-input text-xs resize-none py-2"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  Submit Assistance Request
                </button>
              </form>
            </div>

            {/* List */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-blue-400" /> Active Assistance Requests
                </h3>
                {profile.role === "volunteer" && (
                  <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/25 py-1 px-2 rounded-md font-semibold">
                    ✓ Volunteer Dashboard Active
                  </span>
                )}
              </div>

              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {helpRequests.map((req) => (
                  <div key={req.id} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                          {req.category}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-2 ${
                          req.urgency === "high"
                            ? "bg-red-500/20 text-red-400 border border-red-500/20"
                            : "bg-slate-500/20 text-slate-400"
                        }`}>
                          {req.urgency} Urgency
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : req.status === "assigned"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-yellow-500/10 text-yellow-400 animate-pulse"
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{req.details}</p>

                    {/* Mask location for non-assigned requests unless you are the volunteer */}
                    <div className="text-xs text-slate-400 bg-zinc-950/20 p-2 rounded-lg flex items-center gap-1 border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {req.status === "open"
                          ? `Location masked: [${req.location.split(",")[0]}] (Accept ticket to reveal details)`
                          : `Verified Location: ${req.location}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-white/5">
                      <span>Requester: {req.requester}</span>
                      {req.assignedVolunteer && (
                        <span className="text-blue-400 font-bold">Assigned Mitra: {req.assignedVolunteer}</span>
                      )}
                    </div>

                    {/* Volunteer Matching Actions */}
                    {profile.role === "volunteer" && req.status === "open" && (
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-xs transition cursor-pointer"
                      >
                        Accept Assistance Ticket
                      </button>
                    )}

                    {profile.role === "volunteer" && req.status === "assigned" && req.assignedVolunteer === profile.name && (
                      <button
                        onClick={() => handleCompleteRequest(req.id)}
                        className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded-lg text-xs transition cursor-pointer"
                      >
                        Mark Ticket Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
