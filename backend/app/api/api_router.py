from fastapi import APIRouter
from app.api.endpoints import auth, marketplace, forecasting, logistics, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(marketplace.router, prefix="/marketplace", tags=["Direct Marketplace"])
api_router.include_router(forecasting.router, prefix="/forecasting", tags=["AI Demand Forecasting"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["Logistics & Routing"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["DoCA Ministry Analytics"])
