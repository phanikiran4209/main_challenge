import { GoogleGenerativeAI } from "@google/generative-ai";

interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  isJson: boolean;
  history?: any[];
  geminiKey?: string;
}

async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userPrompt: string,
  isJson: boolean,
  history: any[] = []
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: isJson ? "application/json" : undefined,
      maxOutputTokens: 8192,
    },
  });

  // Map history format to Gemini format
  const formattedHistory = history.map((m) => {
    const role = m.role === "user" ? "user" : "model";
    const text = m.content || (m.parts && m.parts[0]?.text) || "";
    return {
      role,
      parts: [{ text }],
    };
  });

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I will act as Monsoon Mitra and follow these instructions." }] },
    ...formattedHistory,
    { role: "user", parts: [{ text: userPrompt }] },
  ];

  const result = await model.generateContent({ contents });
  return result.response.text();
}

export async function generateLLMResponse({
  systemPrompt,
  userPrompt,
  isJson,
  history = [],
  geminiKey,
}: LLMRequest): Promise<{ provider: "gemini"; text: string }> {
  // Resolve API key (prefer client-supplied header key, fall back to process.env)
  const resolvedGeminiKey = geminiKey || process.env.GEMINI_API_KEY;

  if (!resolvedGeminiKey) {
    throw new Error("Gemini API key is not configured. Please set it in your .env.local file or provide it in the settings.");
  }

  const errors: string[] = [];

  try {
    // Try standard gemini-3.5-flash
    const text = await callGemini(
      resolvedGeminiKey,
      "gemini-3.5-flash",
      systemPrompt,
      userPrompt,
      isJson,
      history
    );
    return { provider: "gemini", text };
  } catch (err: any) {
    console.warn("Gemini 3.5 execution failed, trying fallback model. Error:", err.message);
    errors.push(`Gemini 3.5: ${err.message}`);

    // Try gemini-2.5-flash as a fallback model
    try {
      console.log("Trying gemini-2.5-flash as model fallback...");
      const text = await callGemini(
        resolvedGeminiKey,
        "gemini-2.5-flash",
        systemPrompt,
        userPrompt,
        isJson,
        history
      );
      return { provider: "gemini", text };
    } catch (subErr: any) {
      errors.push(`Gemini (fallback): ${subErr.message}`);
    }
  }

  // If all attempts failed
  throw new Error(`Gemini API execution failed. Errors:\n- ${errors.join("\n- ")}`);
}
