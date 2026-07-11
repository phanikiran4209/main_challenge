# Monsoon Mitra (मानसून मित्र) — AI Weather & Safety Companion

**Monsoon Mitra** is an interactive, GenAI-powered safety and preparedness companion built using Next.js, React, and Tailwind CSS. It is specifically designed to help families, commuters, and rescue volunteers in India prepare for severe monsoon conditions by translating real-time meteorological telemetry into personalized, actionable safety plans.

---

## 🚀 Key Features

*   **Real-Time Geolocation & Weather Simulation**: Search any city or use your GPS coordinates to fetch live weather details (rain levels, temperature, and wind speed) via the keyless Open-Meteo API.
*   **Deterministic Safety Risk Engine**: To prevent AI hallucinations during critical weather emergencies, a local rules-based engine categorizes active threats into `GREEN`, `YELLOW`, `ORANGE`, or `RED` levels based on meteorological thresholds.
*   **Judges Simulation Panel**: Evaluators can instantly override active weather to simulate severe `ORANGE_ALERT` or `RED_ALERT` conditions, testing how the safety lists, circular rings, and checklists respond.
*   **AI Preparedness Plan Generator**: Generates customized safety schedules (Before, During, and After storm events) based on home types, floor levels, vulnerable family members (kids, elderly, pets), and commute routes.
*   **Travel Route Weather Advisor**: Geocodes departure and destination cities to analyze route weather and provide transit-specific safety advisories (e.g. recommending trains/expressways, packing rain ponchos, or warning of hydroplaning risks for two-wheelers).
*   **Multilingual Voice Chat & Dictation**: Talk to the assistant or hear safety plans read aloud in multiple Indian regional languages (Hindi, Marathi, Tamil, Telugu, Malayalam, Gujarati, Bengali, Kannada) using the native browser Web Speech API.
*   **Offline Emergency Hub**: Track offline checklists, access emergency rescue speed dials, look up nearby rescue shelters, match volunteer help tickets, and generate geo-grounded WhatsApp status updates.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Next.js 16 (App Router), TypeScript.
*   **Styling**: Tailwind CSS (v4) with sleek glassmorphism, responsive cards, and glowing threat status badges.
*   **Icons**: Lucide React.
*   **Telemetry**: Open-Meteo Geocoding & Weather Forecast API (No key required, rate-limit friendly).
*   **Orchestration**: Google Generative AI SDK (`@google/generative-ai`) calling `gemini-3.5-flash` (Primary) and `gemini-2.5-flash` (Fallback).
*   **Resiliency**: Custom inline JSON Repair & Balance parser (`src/lib/json-helper.ts`) to fix truncated JSON strings from the LLM, and in-line try-catch event handlers to bypass Next.js development error crash overlays.

---

## 📡 API Endpoints & Request Flow

The application communicates via serverless Next.js API Route Handlers. All AI routes accept an optional browser-session key header (`x-gemini-key`). If missing, they attempt to read the server-side `GEMINI_API_KEY` from `.env.local`.

### 1. Weather & Geocoding Resolver (`/api/weather`)
Fetches coordinates for a location and retrieves real-time weather stats.
*   **Method**: `GET`
*   **Query Params**: `city` (string) or `lat` & `lon` (float)
*   **Risk Level Threshold Logic**:
    *   🔴 **RED**: Rain $\ge 45\text{mm}$, wind speed $\ge 65\text{km/h}$, or weather codes for severe thunderstorms/torrential rain.
    *   🟠 **ORANGE**: Rain $\ge 15\text{mm}$, wind speed $\ge 35\text{km/h}$, or weather codes for light thunderstorms/showers.
    *   🟡 **YELLOW**: Light drizzle or rain active.
    *   🟢 **GREEN**: Clear/dry weather.

### 2. Preparedness Plan Generator (`/api/plan`)
Generates a custom before/during/after preparedness plan.
*   **Method**: `POST`
*   **Headers**: `x-gemini-key` (optional)
*   **Request Body**:
    ```json
    {
      "profile": {
        "language": "Hindi",
        "floor": "Ground Floor",
        "homeType": "Individual House",
        "vehicle": "two_wheeler",
        "medicalNeeds": "Blood pressure medication",
        "specialNeeds": ["elderly", "kids"],
        "members": ["Father", "Mother", "Toddler"]
      },
      "weather": {
        "location": "Kurla, Mumbai",
        "current": { "temp": 28, "rain": 25, "wind": 42 },
        "risk": { "level": "ORANGE", "reason": "Heavy thunderstorm advisory" }
      }
    }
    ```
*   **Response**: A detailed plan formatted to match the `PreparednessPlan` schema (summary, immediate tasks, avoidances, custom emergency kit items, family precautions, recovery safety steps).

### 3. Route Advisory Coordinator (`/api/travel-advisory`)
Evaluates traveling conditions between two points.
*   **Method**: `POST`
*   **Headers**: `x-gemini-key` (optional)
*   **Request Body**:
    ```json
    {
      "origin": "Pune",
      "destination": "Mumbai",
      "departureTime": "Immediate",
      "vehicle": "two_wheeler",
      "language": "English"
    }
    ```
*   **Response**: Safety recommendation (`SAFE`, `CAUTION`, `AVOID`), travel alternatives, packing needs, and weather warnings.

### 4. Interactive Chat Companion (`/api/chat`)
Grants weather-aware contextual chat responses.
*   **Method**: `POST`
*   **Headers**: `x-gemini-key` (optional)
*   **Request Body**:
    ```json
    {
      "messages": [
        { "role": "user", "content": "Is it safe to ride my bike through Kurla subway?" }
      ],
      "profile": { "floor": "Ground Floor", "vehicle": "two_wheeler" },
      "weather": { "location": "Mumbai", "risk": { "level": "ORANGE" } }
    }
    ```
*   **Response**: Contextual warning advising to avoid flooded underpasses and seek alternate routes.

---

## ⚡ How to Run Locally

### Prerequisites
*   Node.js (v18.x or newer)
*   npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment credentials:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the browser: Navigate to **[http://localhost:3000](http://localhost:3000)**.

### Production Build
Verify typescript validation and static route compilation:
```bash
npm run build
```

---

## 🔑 How to Get a Free Gemini API Key

1. Go to the **[Google AI Studio Console](https://aistudio.google.com/)**.
2. Sign in with your Google account.
3. Click on the **Get API key** button on the left sidebar.
4. Click **Create API key** (and select a Google Cloud project).
5. Copy the generated key (it will begin with **`AIzaSy`**).
6. Paste it into your local `.env.local` file or directly into the **Settings Drawer** (⚙️ icon) in the app header.