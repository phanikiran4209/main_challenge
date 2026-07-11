import React from "react";
import { CheckCircle2, AlertCircle, Award } from "lucide-react";

interface ReadinessItem {
  id: string;
  label: string;
  points: number;
  tip: string;
}

const READINESS_ITEMS: ReadinessItem[] = [
  {
    id: "kit",
    label: "Emergency Kit Packed (water, dry food, power bank, flashlight)",
    points: 15,
    tip: "Add emergency contacts and package dry food to reach higher safety.",
  },
  {
    id: "docs",
    label: "Important Documents in Waterproof Bag (IDs, deeds, records)",
    points: 15,
    tip: "Scan your documents and store them in a waterproof zip-lock folder.",
  },
  {
    id: "contacts",
    label: "Family Emergency Contacts & ICE Numbers Saved",
    points: 15,
    tip: "Add local ward office and ambulance contacts to your quick dial list.",
  },
  {
    id: "meds",
    label: "7-Day Supply of Essential Medicines & First Aid",
    points: 15,
    tip: "Ensure chronic prescriptions (like blood pressure or diabetic meds) are filled.",
  },
  {
    id: "drainage",
    label: "Home Drainage Checked & Ground Floor Assets Secured",
    points: 15,
    tip: "Clear gutters, block lower vents, and lift electronics off the floor.",
  },
  {
    id: "travel",
    label: "Commute Plan & Route Weather Safe",
    points: 15,
    tip: "Identify low-lying subways on your route and check weather reports before leaving.",
  },
  {
    id: "shelter",
    label: "Nearest Emergency Shelter & Ward Helpline Identified",
    points: 10,
    tip: "Locate your nearest municipal shelter or school designated for safety.",
  },
];

interface ReadinessScoreProps {
  checkedIds: string[];
  onChange: (checkedIds: string[]) => void;
}

export default function ReadinessScore({ checkedIds, onChange }: ReadinessScoreProps) {
  // Compute score
  const score = READINESS_ITEMS.reduce((sum, item) => {
    return sum + (checkedIds.includes(item.id) ? item.points : 0);
  }, 0);

  const handleToggle = (id: string) => {
    if (checkedIds.includes(id)) {
      onChange(checkedIds.filter((x) => x !== id));
    } else {
      onChange([...checkedIds, id]);
    }
  };

  // Find the first unchecked item to give advice on improvement
  const nextImprovementItem = READINESS_ITEMS.find((item) => !checkedIds.includes(item.id));

  // Determine color theme for progress circle
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500/20";
    if (score >= 50) return "text-yellow-500 border-yellow-500/20";
    return "text-red-500 border-red-500/20";
  };

  const scoreColorClass = getScoreColor(score).split(" ")[0];

  return (
    <div className="glass-card p-6 flex flex-col md:flex-row gap-6 items-center">
      {/* Visual Ring representation */}
      <div className="relative shrink-0 flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={263.89}
            strokeDashoffset={263.89 - (263.89 * score) / 100}
            className={`${scoreColorClass} transition-all duration-500 ease-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-white">{score}</span>
          <span className="text-slate-400 text-xs">/ 100</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase mt-1">Readiness</span>
        </div>
      </div>

      {/* Checklist and Improvement advice */}
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-3">
          {score === 100 ? (
            <Award className="w-5 h-5 text-green-400 animate-bounce" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-400" />
          )}
          <h3 className="font-bold text-white text-base">
            {score === 100 ? "Monsoon Mitra Certified Safe!" : "Personal Readiness Dashboard"}
          </h3>
        </div>

        {/* Dynamic AI-like recommendation text */}
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          {score === 100
            ? "Amazing work! Your household is fully prepared for the monsoon season. Stay updated with real-time weather changes."
            : nextImprovementItem
            ? `Your readiness score is ${score}/100. To reach ${score + nextImprovementItem.points}: ${nextImprovementItem.tip}`
            : `Your readiness score is ${score}/100.`}
        </p>

        {/* Checklist */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {READINESS_ITEMS.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer select-none ${
                  isChecked
                    ? "bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/15"
                    : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(item.id)}
                  className="sr-only"
                />
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 transition ${
                    isChecked ? "text-green-400 fill-green-400/20" : "text-slate-500"
                  }`}
                />
                <div className="flex-1 text-xs md:text-sm font-medium">
                  {item.label}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 ${
                    isChecked ? "bg-green-400/20 text-green-300" : "bg-white/5 text-slate-400"
                  }`}
                >
                  +{item.points} pts
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
