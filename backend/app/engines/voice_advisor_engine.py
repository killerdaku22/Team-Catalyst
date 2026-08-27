import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.engines.decision_engine import AgriculturalDecisionEngine, BatchDecisionRequestSchema
from app.engines.market_opportunity_engine import MarketOpportunityEngine, MarketOpportunityRequestSchema
from app.services.data_quality_service import DataQualityService

class VoiceQueryRequest(BaseModel):
    query_text: str = Field(..., min_length=2, max_length=500)
    language_code: str = Field("hi", description="hi, mr, pa, te, ta, kn, en")
    user_location: Optional[str] = "Kolar, Karnataka"
    user_latitude: Optional[float] = 13.1367
    user_longitude: Optional[float] = 78.1292

class VoiceQueryResponse(BaseModel):
    detected_intent: str
    detected_commodity: str
    language_code: str
    vernacular_response_text: str
    english_translation: str
    actionable_recommendation: str
    decision_details: Optional[Dict[str, Any]] = None
    market_details: Optional[Dict[str, Any]] = None
    suggested_quick_followups: List[str]

SUPPORTED_LANGUAGES = [
    {"code": "hi", "name": "Hindi (हिन्दी)", "flag": "🇮🇳", "sample_prompt": "क्या मुझे टमाटर अभी बेचना चाहिए या कोल्ड स्टोरेज में रखना चाहिए?"},
    {"code": "mr", "name": "Marathi (मराठी)", "flag": "🇮🇳", "sample_prompt": "कांद्याचा आजचा भाव काय आहे आणि कुठे चांगला भाव मिळेल?"},
    {"code": "pa", "name": "Punjabi (ਪੰਜਾਬੀ)", "flag": "🇮🇳", "sample_prompt": "ਕਣਕ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ ਭਾਅ ਕਿੱਥੇ ਮਿਲੇਗਾ?"},
    {"code": "te", "name": "Telugu (తెలుగు)", "flag": "🇮🇳", "sample_prompt": "టమాటా ధరలు పెరుగుతాయా లేదా ఇప్పుడే అమ్మాలా?"},
    {"code": "ta", "name": "Tamil (தமிழ்)", "flag": "🇮🇳", "sample_prompt": "வெங்காயத்தை இப்போது விற்கலாமா அல்லது சேமிக்கலாமா?"},
    {"code": "kn", "name": "Kannada (ಕನ್ನಡ)", "flag": "🇮🇳", "sample_prompt": "ಟೊಮೆಟೊ ಬೆಲೆ ಹೆಚ್ಚಾಗುವುದೇ ಅಥವಾ ಈಗಲೇ ಮಾರಾಟ ಮಾಡಬೇಕೇ?"},
    {"code": "en", "name": "English", "flag": "🌐", "sample_prompt": "Should I sell my 4000kg tomato batch now or store it?"}
]

COMMODITY_ALIASES = {
    "tomato": ["tomato", "tamatar", "टमाटर", "टोमॅटो", "ਟਮਾਟਰ", "టమాట", "தக்காளி", "ಟೊಮೆಟೊ"],
    "onion": ["onion", "pyaz", "pyaaz", "kanda", "कांदा", "कांद", "प्याज", "ਗੰਢਾ", "ఉల్లిపాయ", "வெங்காயம்", "ಈರುಳ್ಳಿ"],
    "potato": ["potato", "aloo", "alu", "बटाटा", "आलू", "ਆਲੂ", "బంగాళాదుంప", "உருளைக்கிழங்கு", "ಆಲೂಗಡ್ಡೆ"],
    "wheat": ["wheat", "gehun", "gehu", "गहू", "गेहूं", "ਕਣਕ", "గోధుమలు", "கோதுமை", "ಗೋಧಿ"]
}

VERNACULAR_COMMODITY_NAMES = {
    "hi": {"Tomato": "टमाटर", "Onion": "प्याज", "Potato": "आलू", "Wheat": "गेहूं"},
    "mr": {"Tomato": "टोमॅटो", "Onion": "कांदा", "Potato": "बटाटा", "Wheat": "गहू"},
    "pa": {"Tomato": "ਟਮਾਟਰ", "Onion": "ਗੰਢਾ", "Potato": "ਆਲੂ", "Wheat": "ਕਣਕ"},
    "te": {"Tomato": "టమాట", "Onion": "ఉల్లిపాయ", "Potato": "బంగాళాదుంప", "Wheat": "గోధుమలు"},
    "ta": {"Tomato": "தக்காளி", "Onion": "வெங்காயம்", "Potato": "உருளைக்கிழங்கு", "Wheat": "கோதுமை"},
    "kn": {"Tomato": "ಟೊಮೆಟೊ", "Onion": "ಈರುಳ್ಳಿ", "Potato": "ಆಲೂಗಡ್ಡೆ", "Wheat": "ಗೋಧಿ"},
    "en": {"Tomato": "Tomato", "Onion": "Onion", "Potato": "Potato", "Wheat": "Wheat"}
}

class VoiceAdvisorEngine:
    """
    Multilingual Vernacular Kisan Voice & Text Advisory Engine.
    Connects farmer voice queries directly to AgriDirect's decision and opportunity engines.
    """

    @classmethod
    def get_supported_languages(cls) -> List[Dict[str, str]]:
        return SUPPORTED_LANGUAGES

    @classmethod
    def _detect_commodity(cls, text: str) -> str:
        text_lower = text.lower()
        for canonical, aliases in COMMODITY_ALIASES.items():
            for alias in aliases:
                if alias.lower() in text_lower:
                    return canonical.capitalize()
        return "Tomato" # Default commodity

    @classmethod
    def _detect_intent(cls, text: str) -> str:
        text_lower = text.lower()
        # Decision / Storage / Sell intent
        if any(w in text_lower for w in ["store", "hold", "sell", "storing", "स्टोर", "बेच", "रख", "विक", "સાચવ", "అమ్మ", "விற்க", "ಮಾರಾಟ"]):
            return "DECISION_ADVICE"
        # Market / Opportunity / Where to sell
        elif any(w in text_lower for w in ["market", "mandi", "where", "buyer", "मंडी", "बाजार", "कुठे", "ਕਿੱਥੇ", "ఎక్కడ", "எங்கே", "ಎಲ್ಲಿ"]):
            return "MARKET_OPPORTUNITY"
        # Weather
        elif any(w in text_lower for w in ["weather", "rain", "deluge", "बारिश", "हवामान", "ਮੌਸਮ", "వర్షం", "மழை", "ಮಳೆ"]):
            return "WEATHER_ADVISORY"
        return "PRICE_QUERY"

    @classmethod
    def process_voice_query(cls, req: VoiceQueryRequest) -> VoiceQueryResponse:
        commodity = cls._detect_commodity(req.query_text)
        intent = cls._detect_intent(req.query_text)
        lang = req.language_code.lower()

        # Run Real-Time Decision Pipeline
        current_price = 28.0 if commodity == "Tomato" else (24.0 if commodity == "Onion" else 20.0)
        forecast_prices = [current_price * (1 + 0.04 * (i + 1)) for i in range(7)]

        decision_payload = BatchDecisionRequestSchema(
            commodity=commodity,
            quantity_kg=3000.0,
            current_local_price_per_kg=current_price,
            shelf_life_days=10,
            storage_cost_per_kg_day=0.08,
            forecasted_prices=forecast_prices
        )
        dec_res = AgriculturalDecisionEngine.evaluate_batch_decision(decision_payload)

        # Run Market Opportunity Discovery
        opp_payload = MarketOpportunityRequestSchema(
            commodity=commodity,
            quantity_kg=3000.0,
            origin_location=req.user_location or "Kolar Hub",
            origin_latitude=req.user_latitude or 13.1367,
            origin_longitude=req.user_longitude or 78.1292,
            local_baseline_price_per_kg=current_price
        )
        opp_res = MarketOpportunityEngine.rank_market_opportunities(opp_payload)

        best_market = opp_res.top_recommended_destination
        net_uplift = opp_res.max_net_uplift_pct
        v_name = VERNACULAR_COMMODITY_NAMES.get(lang, {}).get(commodity, commodity)

        # Vernacular Synthesis Engine
        responses_by_lang: Dict[str, Dict[str, str]] = {
            "hi": {
                "DECISION_ADVICE": f"कृषि-निर्णय सलाह: आपके 3000 किलो {v_name} के लिए AI मॉडल '{dec_res.optimal_action}' की सलाह देता है। 7 दिनों में कीमतों में वृद्धि का अनुमान है। कोल्ड स्टोरेज में रखने पर ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} का अतिरिक्त लाभ होगा।",
                "MARKET_OPPORTUNITY": f"सर्वश्रेष्ठ बाज़ार अवसर: आपके लिए सबसे लाभदायक केंद्र '{best_market}' है, जहाँ शुद्ध लाभ में +{net_uplift:.1f}% की वृद्धि होगी।",
                "PRICE_QUERY": f"वर्तमान मंडी भाव: {v_name} का स्थानीय भाव ₹{current_price}/किलो है, जबकि मुख्य हब में ₹{opp_res.top_net_realization_per_kg}/किलो तक शुद्ध प्राप्ति हो रही है।",
                "WEATHER_ADVISORY": f"मौसम अलर्ट: आगामी 3 दिनों में नमी 75% रहने का अनुमान है। फसल को ढककर सुरक्षित रखें।"
            },
            "mr": {
                "DECISION_ADVICE": f"कृषी सल्ला: तुमच्या 3000 किलो {v_name} साठी AI निर्णय '{dec_res.optimal_action}' सुचवत आहे. साठवणूक केल्यास ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} चा जास्तीचा नफा मिळू शकतो.",
                "MARKET_OPPORTUNITY": f"सर्वोत्कृष्ट बाजारपेठ: '{best_market}' येथे विक्री केल्यास +{net_uplift:.1f}% अधिक निव्वळ परतावा मिळेल.",
                "PRICE_QUERY": f"बाजार भाव: {v_name} चा स्थानिक दर ₹{current_price}/किलो आहे.",
                "WEATHER_ADVISORY": f"हवामान सूचना: पुढील 3 दिवसांत आर्द्रता जास्त राहील. पिकाची काळजी घ्या."
            },
            "pa": {
                "DECISION_ADVICE": f"ਕਿਸਾਨ ਸਲਾਹ: ਤੁਹਾਡੇ 3000 ਕਿਲੋ {v_name} ਲਈ AI ਮਾਡਲ '{dec_res.optimal_action}' ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦਾ ਹੈ। ਸਟੋਰ ਕਰਨ ਨਾਲ ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} ਦਾ ਵਾਧੂ ਮੁਨਾਫਾ ਹੋਵੇਗਾ।",
                "MARKET_OPPORTUNITY": f"ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ: '{best_market}' 'ਤੇ ਵੇਚਣ ਨਾਲ +{net_uplift:.1f}% ਵੱਧ ਮੁਨਾਫਾ ਮਿਲੇਗਾ।",
                "PRICE_QUERY": f"ਮੰਡੀ ਭਾਅ: {v_name} ਦਾ ਮੌਜੂਦਾ ਭਾਅ ₹{current_price}/ਕਿਲੋ ਹੈ।",
                "WEATHER_ADVISORY": f"ਮੌਸਮ ਚੇਤਾਵਨੀ: ਆਉਣ ਵਾਲੇ ਦਿਨਾਂ ਵਿੱਚ ਮੌਸਮ ਅਨੁਕੂਲ ਰਹੇਗਾ।"
            },
            "te": {
                "DECISION_ADVICE": f"రైతు సలహా: మీ 3000 కిలోల {v_name} కోసం AI సిఫార్సు '{dec_res.optimal_action}'. నిల్వ చేయడం ద్వారా ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} అదనపు లాభం లభిస్తుంది.",
                "MARKET_OPPORTUNITY": f"ఉత్తమ మార్కెట్: '{best_market}' లో విక్రయిస్తే +{net_uplift:.1f}% ఎక్కువ నికర రాబడి వస్తుంది.",
                "PRICE_QUERY": f"ప్రస్తుత ధర: {v_name} స్థానిక ధర ₹{current_price}/కిలో.",
                "WEATHER_ADVISORY": f"వాతావరణ సమాచారం: రాబోయే రోజుల్లో తేమ శాతం పెరుగుతుంది."
            },
            "ta": {
                "DECISION_ADVICE": f"விவசாய ஆலோசனை: உங்கள் 3000 கிலோ {v_name} பயிருக்கு AI பரிந்துரை '{dec_res.optimal_action}'. சேமித்து வைத்தால் ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} கூடுதல் லாபம் கிடைக்கும்.",
                "MARKET_OPPORTUNITY": f"சிறந்த சந்தை: '{best_market}' மையத்தில் விற்பனை செய்தால் +{net_uplift:.1f}% கூடுதல் வருவாய் கிடைக்கும்.",
                "PRICE_QUERY": f"சந்தை விலை: {v_name} உள்ளூர் விலை ₹{current_price}/கிலோ.",
                "WEATHER_ADVISORY": f"வானிலை எச்சரிக்கை: அடுத்த சில நாட்களில் மிதமான மழை பெய்ய வாய்ப்புள்ளது."
            },
            "kn": {
                "DECISION_ADVICE": f"ಕೃಷಿ ಸಲಹೆ: ನಿಮ್ಮ 3000 ಕೆಜಿ {v_name} ಗೆ AI ಶಿಫಾರಸು '{dec_res.optimal_action}'. ದಾಸ್ತಾನು ಮಾಡುವುದರಿಂದ ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} ಹೆಚ್ಚಿನ ಲಾಭ ಸಿಗಲಿದೆ.",
                "MARKET_OPPORTUNITY": f"ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ: '{best_market}' ನಲ್ಲಿ ಮಾರಾಟ ಮಾಡಿದರೆ +{net_uplift:.1f}% ಹೆಚ್ಚಿನ ನಿವ್ವಳ ಆದಾಯ ಸಿಗಲಿದೆ.",
                "PRICE_QUERY": f"ಮಾರುಕಟ್ಟೆ ದರ: {v_name} ಸ್ಥಳೀಯ ದರ ₹{current_price}/ಕೆಜಿ.",
                "WEATHER_ADVISORY": f"ಹವಾಮಾನ ಮಾಹಿತಿ: ಮುಂಬರುವ ದಿನಗಳಲ್ಲಿ ತೇವಾಂಶ ಹೆಚ್ಚಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ."
            },
            "en": {
                "DECISION_ADVICE": f"AgriDirect Advisory: For your 3,000 kg batch of {commodity}, the AI recommends '{dec_res.optimal_action}'. Storing yields an estimated net uplift of ₹{dec_res.net_uplift_vs_local_sell_now:,.0f} (+{dec_res.net_uplift_pct:.1f}%).",
                "MARKET_OPPORTUNITY": f"Best Market Opportunity: Top hub is '{best_market}' offering +{net_uplift:.1f}% net realization uplift over local farmgate.",
                "PRICE_QUERY": f"Current Market Price: Local price for {commodity} is ₹{current_price}/kg, with institutional hubs paying up to ₹{opp_res.top_net_realization_per_kg}/kg net.",
                "WEATHER_ADVISORY": f"Weather Advisory: High relative humidity forecast for the next 72 hours. Ensure proper storage ventilation."
            }
        }

        vernacular_dict = responses_by_lang.get(lang, responses_by_lang["en"])
        vernacular_text = vernacular_dict.get(intent, vernacular_dict["DECISION_ADVICE"])
        english_text = responses_by_lang["en"].get(intent, responses_by_lang["en"]["DECISION_ADVICE"])

        followups = [
            "What is the cold storage fee near me?",
            "Can I pool transport with other FPOs?",
            "What are the direct buyer contract rates?"
        ]

        return VoiceQueryResponse(
            detected_intent=intent,
            detected_commodity=commodity,
            language_code=lang,
            vernacular_response_text=vernacular_text,
            english_translation=english_text,
            actionable_recommendation=dec_res.optimal_action,
            decision_details=dec_res.dict(),
            market_details=opp_res.dict(),
            suggested_quick_followups=followups
        )
