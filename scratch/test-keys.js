// Test script to diagnose Gemini and OpenAI credentials
// Run with: node scratch/test-keys.js

const fs = require('fs');
const path = require('path');

// Helper to load env variables from .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
    console.log("Loaded configuration from .env.local");
  } else {
    console.log("No .env.local file found. Checking environment variables...");
  }
}

loadEnv();

const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log("\n--- Credentials Summary ---");
console.log(`Gemini API Key: ${geminiKey ? `Present (starts with: ${geminiKey.substring(0, 6)}...)` : 'Missing'}`);
if (geminiKey && !geminiKey.startsWith('AIzaSy')) {
  console.log("⚠️ WARNING: Standard Gemini API keys from Google AI Studio usually start with 'AIzaSy'. Your key starts with something else, which might cause 403 Forbidden errors.");
}
console.log(`OpenAI API Key: ${openaiKey ? `Present (starts with: ${openaiKey.substring(0, 7)}...)` : 'Missing'}`);

async function testGemini() {
  if (!geminiKey) {
    console.log("\n❌ Gemini: Skipped (No Key)");
    return;
  }
  console.log("\n⏳ Testing Gemini (gemini-3.5-flash)...");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, reply in one word." }] }]
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Gemini SUCCESS: "${data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}"`);
    } else {
      console.log(`❌ Gemini FAILED (HTTP ${res.status}):`);
      console.log(JSON.stringify(data.error || data, null, 2));
    }
  } catch (err) {
    console.log("❌ Gemini connection error:", err.message);
  }
}

async function testOpenAI() {
  if (!openaiKey) {
    console.log("\n❌ OpenAI: Skipped (No Key)");
    return;
  }
  console.log("\n⏳ Testing OpenAI (gpt-4o-mini)...");
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello, reply in one word.' }],
        max_tokens: 5
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✅ OpenAI SUCCESS: "${data.choices?.[0]?.message?.content?.trim()}"`);
    } else {
      console.log(`❌ OpenAI FAILED (HTTP ${res.status}):`);
      console.log(JSON.stringify(data.error || data, null, 2));
    }
  } catch (err) {
    console.log("❌ OpenAI connection error:", err.message);
  }
}

async function runTests() {
  await testGemini();
  await testOpenAI();
}

runTests();
