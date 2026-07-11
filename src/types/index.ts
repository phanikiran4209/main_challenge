export interface UserProfile {
  name: string;
  phone: string;
  language: string;
  members: string[]; // "Toddler/Child", "Elderly", "Pregnant Person", "Disability"
  homeType: string; // "Kutcha House", "Coastal/Riverside Area", "Standard Building"
  floor: string; // "Ground Floor", "First Floor", "Higher Floor"
  vehicle: string; // "Two-wheeler", "Car", "None"
  commuteRoute: string;
  emergencyContacts: string;
  medicalNeeds: string;
  role: string; // "citizen" | "volunteer" | "authority"
  readinessCheckedItems?: string[]; // stored state of readiness list
}

export interface WeatherData {
  location: string;
  coordinates: { lat: number; lon: number };
  current: {
    temp: number;
    humidity: number;
    feels_like: number;
    rain: number;
    wind: number;
    weather_code: number;
    description: string;
    category: string;
  };
  risk: {
    level: "GREEN" | "YELLOW" | "ORANGE" | "RED";
    reason: string;
  };
  forecast: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    precipitation_sum: number;
    precipitation_prob: number;
    weather_code: number;
    description: string;
  }>;
}

export interface PreparednessPlan {
  risk_level: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  summary: string;
  do_now: string[];
  avoid: string[];
  emergency_kit: string[];
  family_precautions: string[];
  emergency_action: string;
  recovery_actions: string[];
}

export interface TravelAdvisory {
  safety_level: "SAFE" | "CAUTION" | "AVOID";
  reason: string;
  best_time: string;
  alternate_route: string;
  what_to_carry: string[];
  survival_tips: string[];
  disclaimer: string;
}
