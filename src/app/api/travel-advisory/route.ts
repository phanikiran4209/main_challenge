import { NextResponse } from "next/server";
import { generateLLMResponse } from "@/lib/ai-helper";
import { extractAndParseJson } from "@/lib/json-helper";

async function fetchCityWeather(city: string) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) return null;
    
    const result = geoData.results[0];
    const { latitude: lat, longitude: lon, name, country } = result;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) return null;
    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    return {
      name: `${name}, ${result.admin1 || ""} (${country})`,
      temp: current?.temperature_2m,
      rain: current?.precipitation || current?.rain || 0,
      wind: current?.wind_speed_10m || 0,
      weather_code: current?.weather_code || 0,
    };
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, departureTime, vehicle, language = "English" } = body;

    if (!origin || !destination) {
      return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
    }

    const geminiKey = request.headers.get("x-gemini-key") || undefined;

    // Fetch weather at origin and destination
    const originWeather = await fetchCityWeather(origin);
    const destWeather = await fetchCityWeather(destination);

    const systemPrompt = `
You are Monsoon Mitra, an AI-powered safety companion for monsoons in India.
Provide a detailed travel safety advisory for a trip from "${origin}" to "${destination}" in "${language}".
`;

    const userPrompt = `
Departure Time: ${departureTime || "Immediate"}
Vehicle: ${vehicle || "Car / Two-wheeler"}

Origin Weather Resolved:
${originWeather ? JSON.stringify(originWeather) : "Not resolved. Assume moderate rain."}

Destination Weather Resolved:
${destWeather ? JSON.stringify(destWeather) : "Not resolved. Assume moderate rain."}

Your advice must be tailored to the vehicle type and weather constraints.
If the weather is extremely bad (heavy rain > 30mm, thunderstorms, high wind), recommend avoiding travel.
For two-wheelers, rain and wind pose higher slip/skid risks.
For ground transit between cities (e.g. Pune to Mumbai, Chennai to Bengaluru), mention typical ghats/flooding points if relevant (like Khandala ghat for Mumbai-Pune, waterlogging in low-lying subways).

Translate all text outputs into "${language}". Keep JSON keys exactly as requested.

Respond with a JSON object of the following format:
{
  "safety_level": "SAFE" | "CAUTION" | "AVOID",
  "reason": "A 1-2 sentence description in ${language} explaining why this safety level was selected based on weather at origin/destination.",
  "best_time": "Recommendation of the best departure window or advising to stay home in ${language}.",
  "alternate_route": "Suggesting an alternate route (e.g. Expressway vs Old Highway) or transit mode (e.g. train instead of road) in ${language}.",
  "what_to_carry": ["3 to 5 essentials, e.g. raincoat, dry snacks, power banks, basic first aid, emergency contact numbers."],
  "survival_tips": ["2 to 4 tips on what to do if stuck in waterlogging or traffic gridlock."],
  "disclaimer": "AI-assisted guidance; follow local disaster management and police travel advisories."
}

Respond ONLY with this JSON object. Do not wrap in markdown code blocks or add extra commentary.
`;

    const result = await generateLLMResponse({
      systemPrompt,
      userPrompt,
      isJson: true,
      geminiKey,
    });

    let parsedData;
    try {
      parsedData = extractAndParseJson(result.text);
    } catch (e: any) {
      console.error("AI travel advice JSON parsing failure. Raw text:", result.text, "Error:", e.message);
      return NextResponse.json({ 
        error: `Failed to generate travel advisory in JSON format. Raw output: "${result.text.substring(0, 150)}..."` 
      }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Travel Advisory API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
