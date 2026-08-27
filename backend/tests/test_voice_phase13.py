import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engines.voice_advisor_engine import (
    VoiceAdvisorEngine,
    VoiceQueryRequest,
    VoiceQueryResponse
)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_get_supported_languages():
    """Verify all 7 supported Indian languages are returned."""
    langs = VoiceAdvisorEngine.get_supported_languages()
    assert len(langs) >= 7
    codes = [l["code"] for l in langs]
    assert "hi" in codes
    assert "mr" in codes
    assert "pa" in codes
    assert "te" in codes
    assert "ta" in codes
    assert "kn" in codes
    assert "en" in codes

def test_hindi_voice_decision_query():
    """Verify Hindi natural language query for storage vs selling."""
    req = VoiceQueryRequest(
        query_text="क्या मुझे टमाटर अभी बेचना चाहिए या कोल्ड स्टोरेज में रखना चाहिए?",
        language_code="hi"
    )
    res = VoiceAdvisorEngine.process_voice_query(req)
    assert res.detected_commodity == "Tomato"
    assert res.detected_intent == "DECISION_ADVICE"
    assert res.language_code == "hi"
    assert "टमाटर" in res.vernacular_response_text
    assert res.actionable_recommendation in ["SELL_NOW", "STORE", "MOVE", "SPLIT"]
    assert res.decision_details is not None

def test_marathi_market_opportunity_query():
    """Verify Marathi natural language query for market discovery."""
    req = VoiceQueryRequest(
        query_text="कांद्याचा आजचा भाव काय आहे आणि कुठे चांगला भाव मिळेल?",
        language_code="mr"
    )
    res = VoiceAdvisorEngine.process_voice_query(req)
    assert res.detected_commodity == "Onion"
    assert res.detected_intent == "MARKET_OPPORTUNITY"
    assert res.language_code == "mr"
    assert len(res.suggested_quick_followups) > 0

def test_punjabi_wheat_query():
    """Verify Punjabi natural language query for Wheat."""
    req = VoiceQueryRequest(
        query_text="ਕਣਕ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ ਭਾਅ ਕਿੱਥੇ ਮਿਲੇਗਾ?",
        language_code="pa"
    )
    res = VoiceAdvisorEngine.process_voice_query(req)
    assert res.detected_commodity == "Wheat"
    assert res.language_code == "pa"

def test_api_voice_query_endpoint(client: TestClient):
    """Verify FastAPI endpoint POST /api/v1/voice/query."""
    payload = {
        "query_text": "What is the best selling opportunity for my tomato harvest?",
        "language_code": "en",
        "user_location": "Kolar, Karnataka",
        "user_latitude": 13.1367,
        "user_longitude": 78.1292
    }
    response = client.post("/api/v1/voice/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["detected_commodity"] == "Tomato"
    assert "Tomato" in data["english_translation"]
    assert len(data["suggested_quick_followups"]) >= 2
