import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react';

interface VoiceQueryResponse {
  detected_intent: string;
  detected_commodity: string;
  language_code: string;
  vernacular_response_text: string;
  english_translation: string;
  actionable_recommendation: string;
  decision_details?: any;
  market_details?: any;
  suggested_quick_followups: string[];
}

const LANGUAGES = [
  { code: 'hi', name: 'हिन्दी (Hindi)', prompt: 'क्या मुझे टमाटर अभी बेचना चाहिए या स्टोर करना चाहिए?' },
  { code: 'mr', name: 'मराठी (Marathi)', prompt: 'कांद्याचा आजचा भाव काय आहे आणि कुठे चांगला भाव मिळेल?' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', prompt: 'ਕਣਕ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ ਭਾਅ ਕਿੱਥੇ ਮਿਲੇਗਾ?' },
  { code: 'te', name: 'తెలుగు (Telugu)', prompt: 'టమాటా ధరలు పెరుగుతాయా లేదా ఇప్పుడే అమ్మాలా?' },
  { code: 'ta', name: 'தமிழ் (Tamil)', prompt: 'வெங்காயத்தை இப்போது விற்கலாமா அல்லது சேமிக்கலாமா?' },
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
    } catch (e) {
      console.warn("Voice assistant error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map lang code
    const langMap: Record<string, string> = {
      hi: 'hi-IN',
      mr: 'mr-IN',
      pa: 'pa-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      en: 'en-IN'
    };
    utterance.lang = langMap[langCode] || 'hi-IN';
    utterance.rate = 0.95;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleMicListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not natively supported on this browser. You can click on the quick sample questions below!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = {
      hi: 'hi-IN',
      mr: 'mr-IN',
      pa: 'pa-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      en: 'en-IN'
    };
    recognition.lang = langMap[selectedLang] || 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQueryText(transcript);
      setIsListening(false);
      handleQuerySubmit(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white p-3.5 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 border border-emerald-400/40 hover:scale-105 transition-all group"
        title="Multilingual Kisan Voice Assistant (Bhashini AI)"
      >
        <div className="relative">
          <Mic className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
        </div>
        <span className="text-xs font-extrabold pr-1 hidden sm:inline">किसान आवाज़ AI (Voice)</span>
      </button>

      {/* Multilingual Voice Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 max-w-xl w-full space-y-5 animate-fadeIn shadow-2xl shadow-emerald-950 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Multilingual Kisan Voice Assistant (Bhashini AI)</h3>
                  <p className="text-[11px] text-slate-400">Speak or query in your native language for instant economic advice</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    stopSpeaking();
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedLang === lang.code
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>

            {/* Voice Input Box & Mic Trigger */}
            <div className="relative">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit(queryText)}
                placeholder="बोलें या लिखें... (Speak or type your question)"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-4 pr-24 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  onClick={toggleMicListening}
                  className={`p-2 rounded-xl text-white transition-all ${
                    isListening
                      ? 'bg-rose-600 animate-ping'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                  title={isListening ? 'Listening...' : 'Click to Speak'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleQuerySubmit(queryText)}
                  disabled={isLoading || !queryText.trim()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isLoading ? '...' : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Sample Questions in Selected Language */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Quick Voice Prompts:</span>
              <div className="space-y-1">
                {LANGUAGES.filter(l => l.code === selectedLang).map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setQueryText(l.prompt);
                      handleQuerySubmit(l.prompt);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-slate-200 text-xs transition-all flex items-center justify-between group"
                  >
                    <span>💬 "{l.prompt}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Synthesis Audio Response Card */}
            {response && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {response.detected_intent}
                    </span>
                    <span className="text-white text-xs font-bold font-mono">
                      Crop: {response.detected_commodity}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isSpeaking ? (
                      <button
                        onClick={stopSpeaking}
                        className="p-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg text-xs flex items-center space-x-1"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Mute</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => speakResponse(response.vernacular_response_text, selectedLang)}
                        className="p-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs flex items-center space-x-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Listen</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Vernacular Spoken Text */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-white font-medium text-xs leading-relaxed">
                  🗣️ {response.vernacular_response_text}
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  🌐 English Translation: "{response.english_translation}"
                </div>

                {/* Actionable Tag */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">Optimal AI Recommendation:</span>
                  <span className="font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                    {response.actionable_recommendation}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
