from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str
    database: str
    timestamp: datetime
