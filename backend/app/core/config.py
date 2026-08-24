import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from project root
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriDirect SIH26033 Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih26033_super_secret_national_prototype_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database — Supabase PostgreSQL (via transaction pooler)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres.exbbzawroyhgvcdgrtqc:Harsh%40wardhan147@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    )
    
    # Supabase API credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://exbbzawroyhgvcdgrtqc.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_0BiaZWuy2dSy0heY3td9qg_xtQWWm4W")
    
    # External Real API Integration Points
    AGMARKNET_API_URL: str = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    OSRM_ROUTING_URL: str = "https://router.project-osrm.org/route/v1/driving"
    
    class Config:
        case_sensitive = True

settings = Settings()
