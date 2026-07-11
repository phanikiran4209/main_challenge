/**
 * Robustly attempts to repair and parse potentially truncated JSON responses from LLMs.
 */
export function repairTruncatedJson(str: string): string {
  let clean = str.trim();

  // Balance brackets/braces
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let i = 0;

  for (; i < clean.length; i++) {
    const char = clean[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '{' || char === '[') {
      stack.push(char);
    } else if (char === '}') {
      if (stack.length > 0 && stack[stack.length - 1] === '{') {
        stack.pop();
      }
    } else if (char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
  }

  // If we ended inside a string, close the quote
  if (inString) {
    clean += '"';
  }

  // Close all unclosed containers in reverse order
  while (stack.length > 0) {
    const last = stack.pop();
    clean = clean.trim();
    if (clean.endsWith(',')) {
      clean = clean.slice(0, -1).trim();
    }
    if (last === '{') {
      clean += '}';
    } else if (last === '[') {
      clean += ']';
    }
  }

  return clean;
}

/**
 * Extracts and parses valid JSON from a raw string, handling markdown wrappers, 
 * trailing text, and truncation.
 */
export function extractAndParseJson(rawText: string): any {
  const trimmed = rawText.trim();
  
  // 1. Try parsing directly
  try {
    return JSON.parse(trimmed);
  } catch (e) {}

  // 2. Remove markdown formatting backticks if present
  let cleanText = trimmed;
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  
  // If cleanText ends with markdown backticks, strip them
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();

  // Try parsing cleaned text
  try {
    return JSON.parse(cleanText);
  } catch (e) {}

  // 3. Find first '{' to start parsing
  const firstBraceIdx = cleanText.indexOf("{");
  if (firstBraceIdx === -1) {
    throw new Error("No JSON object starting brace '{' found.");
  }

  // Slice text from the first brace
  let possibleJson = cleanText.substring(firstBraceIdx);

  // If there's extra conversational text at the end, try to find the matching closing brace
  // We'll first try to find the last closing brace '}'
  const lastBraceIdx = possibleJson.lastIndexOf("}");
  if (lastBraceIdx !== -1) {
    const closedCandidate = possibleJson.substring(0, lastBraceIdx + 1);
    try {
      return JSON.parse(closedCandidate);
    } catch (e) {}
  }

  // 4. If all direct parsing failed, the JSON may be truncated (missing closing brackets).
  // We apply our repair utility to balance braces/brackets.
  const repairedText = repairTruncatedJson(possibleJson);
  try {
    return JSON.parse(repairedText);
  } catch (e: any) {
    throw new Error(`JSON parsing failed after cleaning and repair. Parse error: ${e.message}`);
  }
}
