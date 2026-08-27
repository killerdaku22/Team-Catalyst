import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status

class RateLimiter:
    """
    Sliding window in-memory rate limiter dependency for FastAPI endpoints.
    Tracks client IP request timestamps and enforces rate limits.
    """
    def __init__(self, times: int = 10, seconds: int = 60):
        self.times = times
        self.seconds = seconds
        self.history: Dict[str, List[float]] = defaultdict(list)

    def _get_client_identifier(self, request: Request) -> str:
        # Check for forwarded headers if behind reverse proxy / load balancer
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        client = request.client
        return client.host if client else "unknown"

    async def __call__(self, request: Request):
        client_ip = self._get_client_identifier(request)
        now = time.time()
        window_start = now - self.seconds

        # Filter out timestamps older than current sliding window
        self.history[client_ip] = [t for t in self.history[client_ip] if t > window_start]

        if len(self.history[client_ip]) >= self.times:
            retry_after = int(self.seconds - (now - self.history[client_ip][0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Max {self.times} requests per {self.seconds}s. Please retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)}
            )

        self.history[client_ip].append(now)
        return True
