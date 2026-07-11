import { NextResponse } from "next/server";
import { generateLLMResponse } from "@/lib/ai-helper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, profile, weather } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const geminiKey = request.headers.get("x-gemini-key") || undefined;
    const lang = profile?.language || "English";

    // System prompt grounding the model in weather and profile context
    const systemPrompt = `
You are Monsoon Mitra, a safety-focused monsoon preparedness assistant for India.
The user is speaking to you. You must respond in the user's selected language: "${lang}".
If the user inputs their query in another language (e.g., Hindi, Marathi), respond in that same language, maintaining a helpful, calm, and safety-oriented tone.

Grounding Context:
- User Location: ${weather?.location || "Unknown"}
- Household Profile: Floor level: ${profile?.floor || "Apartment"}, Home type: ${profile?.homeType || "Apartment"}, Members: ${profile?.members ? profile.members.join(", ") : "None"}, Medical needs: ${profile?.medicalNeeds || "None"}, Commute: ${profile?.commuteRoute || "None"}
- Live Weather: Temp: ${weather?.current?.temp || "N/A"}°C, Rain: ${weather?.current?.rain || 0}mm, Wind: ${weather?.current?.wind || 0}km/h, Condition: ${weather?.current?.description || "N/A"}, Calculated Risk level: ${weather?.risk?.level || "GREEN"}, Reason: ${weather?.risk?.reason || "Normal"}

Rules:
1. Always prioritize human safety. For life-threatening situations, tell them to call emergency contacts (112 or 108) immediately.
2. Stick to the provided weather data. Do not invent weather alerts, active flooding locations, or specific shelter addresses unless provided in the context.
3. Be concise and actionable. Use bullet points for steps where appropriate.
`;

    // Extract last user message as the active prompt, send previous list as history
    const history = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.content || "";

    const result = await generateLLMResponse({
      systemPrompt,
      userPrompt,
      isJson: false,
      history,
      geminiKey,
    });

    return NextResponse.json({ response: result.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
