import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Sparkles,
  Globe
} from 'lucide-react';

interface VoiceQueryResponse {
  detected_intent: string;
  detected_commodity: string;
  language_code: string;
  vernacular_response_text: string;
  english_translation: string;
  actionable_recommendation: string;
  decision_details?: any;
}

const LANGUAGES = [
  { code: 'hi', name: 'हिन्दी (Hindi)', prompt: 'क्या मुझे टमाटर अभी बेचना चाहिए या स्टोर करना चाहिए?' },
  { code: 'mr', name: 'मराठी (Marathi)', prompt: 'कांद्याचा आजचा भाव काय आहे आणि कुठे चांगला भाव मिळेल?' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', prompt: 'ਕਣਕ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ ਭਾਅ ਕਿੱਥੇ ਮਿਲੇਗਾ?' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', prompt: 'ಟೊಮೆಟೊ ಬೆಲೆ ಹೆಚ್ಚಾಗುವುದೇ ಅಥವಾ ಈಗಲೇ ಮಾರಾಟ ಮಾಡಬೇಕೇ?' },
  { code: 'en', name: 'English', prompt: 'Should I sell my tomato batch now or hold for cold storage?' }
];

export const VoiceKisanAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<VoiceQueryResponse | null>(null);

  const API_BASE = ((import.meta as any).env?.VITE_API_BASE as string) || 'http://localhost:8000/api/v1';

  const handleQuerySubmit = async (textToQuery: string) => {
    if (!textToQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/voice/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_text: textToQuery,
          language_code: selectedLang,
          user_location: "Kolar Agri Hub",
          user_latitude: 13.1367,
          user_longitude: 78.1292
        })
      });

      if (res.ok) {
        const data: VoiceQueryResponse = await res.json();
        setResponse(data);
        speakResponse(data.vernacular_response_text, selectedLang);
      }
    } catch {
      // Fallback simulated response
      setResponse({
        detected_intent: 'DECISION_SUPPORT',
        detected_commodity: 'Tomato',
        language_code: selectedLang,
        vernacular_response_text: 'कोलार मंडी में वर्तमान भाव ₹28 प्रति किलो है। 14 दिनों के पूर्वानुमान के अनुसार भाव ₹34.50 तक जाने की संभावना है। होल्ड करना फायदेमंद हो सकता है।',
        english_translation: 'Current price at Kolar mandi is ₹28/kg. Forecast suggests prices may rise to ₹34.50 in 14 days. Holding with cold storage has positive expected return.',
        actionable_recommendation: 'HOLD / STORE'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { hi: 'hi-IN', mr: 'mr-IN', pa: 'pa-IN', kn: 'kn-IN', en: 'en-IN' };
    utterance.lang = langMap[langCode] || 'hi-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Compact Bottom-Right Floating Trigger Button (38px Height) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-[#2D6A4F] hover:bg-[#245740] text-white px-3 py-2 rounded-full shadow-lg border border-[#3D4D45] flex items-center space-x-2 text-xs font-semibold transition-all hover:scale-105"
          aria-label="Open Voice Assistant"
        >
          <Mic className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Voice Assistant</span>
        </button>
      )}

      {/* Compact Modal Dialog When Open */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-[#1A221E] border border-[#2B3731] rounded-2xl shadow-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#2B3731]">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-[#2D6A4F] flex items-center justify-center text-white">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white text-sm">Voice Kisan Assistant</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className="text-[#8E9C93] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-[#52796F] shrink-0" />
            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                const l = LANGUAGES.find(item => item.code === e.target.value);
                if (l) setQueryText(l.prompt);
              }}
              className="ad-input h-8 text-xs py-0"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[#1A221E] text-white">
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input & Action */}
          <div className="space-y-1.5">
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask about market prices, selling or storage decisions..."
              rows={2}
              className="w-full bg-[#121815] border border-[#2B3731] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#52796F] resize-none"
            />
            <button
              onClick={() => handleQuerySubmit(queryText)}
              disabled={isLoading || !queryText.trim()}
              className="ad-btn-primary w-full h-8 text-xs"
            >
              <span>{isLoading ? 'Processing Query...' : 'Get Recommendation'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Response Output */}
          {response && (
            <div className="bg-[#121815] border border-[#2B3731] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="ad-badge ad-badge-success text-[10px]">
                  {response.actionable_recommendation}
                </span>
                <span className="text-[10px] text-[#8E9C93]">{response.detected_commodity}</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-medium">
                {response.vernacular_response_text}
              </p>
              <p className="text-[10px] text-[#8E9C93] italic">
                {response.english_translation}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
