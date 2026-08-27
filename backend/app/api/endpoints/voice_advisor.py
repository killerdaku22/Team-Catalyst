from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Dict, Any

from app.engines.voice_advisor_engine import (
    VoiceAdvisorEngine,
    VoiceQueryRequest,
    VoiceQueryResponse
)

router = APIRouter()

@router.get("/languages", response_model=List[Dict[str, str]])
def get_supported_languages():
    """Retrieve supported vernacular Indian languages for voice queries."""
    return VoiceAdvisorEngine.get_supported_languages()

@router.post("/query", response_model=VoiceQueryResponse)
def process_voice_or_text_query(req: VoiceQueryRequest):
    """
    Process farmer voice query in Hindi, Marathi, Punjabi, Telugu, Tamil, Kannada, or English.
    Returns real-time synthesized economic decision advice, price benchmarks, and market opportunities.
    """
    try:
        return VoiceAdvisorEngine.process_voice_query(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Voice processing failed: {str(e)}")
