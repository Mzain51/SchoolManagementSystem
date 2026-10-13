from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "School Management System"
    API_V1_STR: str = "/api/v1"
    
    # Regional defaults for Pakistan
    DEFAULT_CURRENCY: str = "PKR"
    DEFAULT_TIMEZONE: str = "Asia/Karachi"
    
    # Database
    DATABASE_URL: str = "sqlite:///./sms_dev.db"
    DIRECT_URL: Optional[str] = None
    
    # Supabase Auth & JWT
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_ANON_KEY: str = "placeholder-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-service-role-key"
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_JWKS_URL: str = ""
    SUPABASE_JWT_ISSUER: Optional[str] = None
    
    # Security & Development Flags
    ENABLE_DEV_AUTH_BYPASS: bool = False
    DEV_ADMIN_EMAIL: str = "admin@schools.pk"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
