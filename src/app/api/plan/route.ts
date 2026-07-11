import { NextResponse } from "next/server";
import { generateLLMResponse } from "@/lib/ai-helper";
import { extractAndParseJson } from "@/lib/json-helper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, weather } = body;

    if (!profile) {
      return NextResponse.json({ error: "Profile details are required." }, { status: 400 });
    }

    const geminiKey = request.headers.get("x-gemini-key") || undefined;
    const lang = profile.language || "English";

    const systemPrompt = `
You are Monsoon Mitra, an AI-powered safety companion for monsoons in India.
Generate a personalized monsoon preparedness plan for this user based on their profile and the current weather.
The response must be in the language: "${lang}". If the language is not English, translate all display texts, summaries, and actions into that language, but keep the JSON keys exactly as requested.
`;

    const userPrompt = `
User Profile:
- Location: ${weather?.location || "Unknown"}
- Household Members: ${profile.members ? profile.members.join(", ") : "None"}
- Home Details: Floor level: ${profile.floor || "Apartment"}, Home type: ${profile.homeType || "Apartment"}
- Vehicle: ${profile.vehicle || "None"}
- Medical Needs: ${profile.medicalNeeds || "None"}
- Commute Route: ${profile.commuteRoute || "None"}
- Special Needs (Elderly, Kids, Pets, Disability): ${profile.specialNeeds ? profile.specialNeeds.join(", ") : "None"}

Current Weather:
- Temperature: ${weather?.current?.temp || "N/A"}°C
- Description: ${weather?.current?.description || "N/A"}
- Rain: ${weather?.current?.rain || "0"} mm
- Wind: ${weather?.current?.wind || "0"} km/h
- Calculated Risk level: ${weather?.risk?.level || "GREEN"}
- Risk explanation: ${weather?.risk?.reason || "No warnings active."}

Your task is to return a JSON object with this exact structure:
{
  "risk_level": "${weather?.risk?.level || "GREEN"}",
  "summary": "A 2-3 sentence personalized summary explaining the current weather threat to their specific household configuration in ${lang}.",
  "do_now": ["3 to 5 immediate actions they must take right now based on their floor level, medical needs, and current rain severity. Keep them short, active, and specific."],
  "avoid": ["2 to 4 things to avoid right now, e.g. specific roads/activities."],
  "emergency_kit": ["4 to 6 emergency kit items. Ensure items are highly customized to their household, e.g., pediatric medicine if they have kids, pet food if they have pets, specific power banks if they commute."],
  "family_precautions": ["2 to 4 precautions specific to the members list, e.g. how to move elderly or protect pets."],
  "emergency_action": "A brief emergency safety instruction in case of sudden flooding, mains failure, or lightning.",
  "recovery_actions": ["3 to 4 safety and hygiene steps for after the rain stops, e.g. check for stagnant water, verify structural safety."]
}

Respond ONLY with this JSON object. Do not wrap in markdown code blocks or add extra commentary.
`;

    const result = await generateLLMResponse({
      systemPrompt,
      userPrompt,
      isJson: true,
      geminiKey,
    });

    // Extract and parse JSON with robust repair logic
    let parsedData;
    try {
      parsedData = extractAndParseJson(result.text);
    } catch (e: any) {
      console.error("AI JSON parsing failure. Raw text:", result.text, "Error:", e.message);
      return NextResponse.json({ 
        error: `Failed to generate plan in JSON format. Raw output: "${result.text.substring(0, 150)}..."` 
      }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Plan Generation Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
