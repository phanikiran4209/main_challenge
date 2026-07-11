import React, { useState, useEffect, useRef } from "react";
import { UserProfile, WeatherData } from "@/types";
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, RefreshCw, User, HelpCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VoiceChatProps {
  profile: UserProfile;
  weather: WeatherData | null;
  geminiKey: string;
}

// Quick suggestions based on selected language
const HINDI_SUGGESTIONS = [
  "मेरे एरिया में बाढ़ का रिस्क है क्या?",
  "बारिश में बच्चे को स्कूल भेजना सुरक्षित है?",
  "मुझे तुरंत क्या करना चाहिए?",
];

const ENGLISH_SUGGESTIONS = [
  "Is there a flood risk in my area?",
  "Is it safe to commute to work today?",
  "What emergency actions should I take right now?",
];

export default function VoiceChat({
  profile,
  weather,
  geminiKey,
}: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [error, setError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup Web Speech API Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        // Match language preference
        const langCode = getLangCode(profile.language);
        recognition.lang = langCode;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setError("");
        };

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setInput(speechResult);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === "not-allowed") {
            setError("Microphone permission denied.");
          } else {
            setError(`Speech recognition error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    // Stop speaking on unmount
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, [profile.language]);

  const getLangCode = (lang: string) => {
    switch (lang) {
      case "Hindi":
        return "hi-IN";
      case "Marathi":
        return "mr-IN";
      case "Tamil":
        return "ta-IN";
      case "Telugu":
        return "te-IN";
      case "Bengali":
        return "bn-IN";
      case "Kannada":
        return "kn-IN";
      case "Gujarati":
        return "gu-IN";
      case "Malayalam":
        return "ml-IN";
      case "English":
      default:
        return "en-IN";
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !ttsEnabled) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Remove markdown symbols (asterisks, bullet points) for cleaner reading
    const cleanText = text
      .replace(/[*#`_\-]/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLangCode(profile.language);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    handleStopSpeaking();
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    if (!textToSend) setInput("");

    setError("");
    const userMsg: Message = { role: "user", content: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiKey) {
        headers["x-gemini-key"] = geminiKey;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg],
          profile,
          weather,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Voice Chat Assistant Error:", data.error);
        setError("AI guidance is temporarily unavailable. Weather alerts and emergency contacts remain available.");
        setLoading(false);
        return;
      }

      const reply: Message = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, reply]);

      // Speak answer out loud
      if (ttsEnabled) {
        handleSpeak(data.response);
      }
    } catch (err: any) {
      console.error("Voice Chat Assistant Error:", err);
      setError("AI guidance is temporarily unavailable. Weather alerts and emergency contacts remain available.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    handleStopSpeaking();
    setMessages([]);
    setError("");
  };

  const suggestions = profile.language === "Hindi" ? HINDI_SUGGESTIONS : ENGLISH_SUGGESTIONS;

  return (
    <div className="glass-card p-6 flex flex-col h-[550px] border border-white/10">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="font-bold text-white text-base">Multilingual AI Voice Assistant</h2>
            <span className="text-[10px] text-slate-400 font-medium">
              Mode: {profile.language} ({getLangCode(profile.language)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Speaker Toggle */}
          <button
            onClick={() => {
              if (ttsEnabled) {
                handleStopSpeaking();
              }
              setTtsEnabled(!ttsEnabled);
            }}
            className={`p-2 rounded-lg transition border cursor-pointer ${
              ttsEnabled
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-white/5 border-white/5 text-slate-500"
            }`}
            title={ttsEnabled ? "Voice outputs enabled" : "Voice outputs muted"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset button */}
          <button
            onClick={clearChat}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 border border-white/5 transition cursor-pointer"
            title="Clear Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-full animate-bounce">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Welcome to Monsoon Mitra Chat</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                Ask about the safety of your area, commuter concerns, or get immediate actions in your preferred language.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="w-full max-w-md pt-4 space-y-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Quick Questions
              </div>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="w-full text-left bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 transition cursor-pointer"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="p-1.5 bg-blue-600 rounded-lg shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl p-3.5 text-sm leading-relaxed border ${
                    isUser
                      ? "bg-blue-600/20 border-blue-500/30 text-slate-100 rounded-tr-none"
                      : "bg-white/5 border-white/5 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-medium">{m.content}</div>
                  {!isUser && ttsEnabled && (
                    <button
                      onClick={() => handleSpeak(m.content)}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold mt-2 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      Listen
                    </button>
                  )}
                </div>
                {isUser && (
                  <div className="p-1.5 bg-slate-700 rounded-lg shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="p-1.5 bg-blue-600 rounded-lg shrink-0 mt-0.5 animate-pulse">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl rounded-tl-none p-3.5 text-sm text-slate-400 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mitra is typing response...
            </div>
          </div>
        )}

        {isSpeaking && (
          <div className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 py-1.5 px-3 rounded-lg flex items-center justify-between animate-pulse">
            <span>🔊 Mitra is speaking response...</span>
            <button
              onClick={handleStopSpeaking}
              className="text-[10px] underline font-bold hover:text-blue-300 cursor-pointer"
            >
              Stop playback
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input panel */}
      <div className="border-t border-white/10 pt-4 shrink-0 space-y-2">
        {error && (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/25 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {/* Micro button */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-3 rounded-xl transition border cursor-pointer ${
              isListening
                ? "bg-red-600 border-red-500 text-white animate-pulse"
                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            title={isListening ? "Stop listening" : "Start Voice Input"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={
              isListening
                ? "Listening... speak now"
                : `Type message in ${profile.language || "English"}...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isListening}
            className="glass-input text-sm flex-1 disabled:opacity-50"
          />

          {/* Send button */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
