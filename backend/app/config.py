from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "FiveMinds"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    @property
    def PRODUCTION(self) -> bool:
        return self.ENVIRONMENT == "production"

    SECRET_KEY: str = "change-this-in-production-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS — comma-separated list from env, or defaults
    CORS_ORIGINS_STR: str = "http://localhost:5173,http://localhost:3000"
    FRONTEND_URL: str = ""

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    DATABASE_URL: str = "postgresql://user:pass@localhost/fiveminds"

    REDIS_URL: str = ""  # Optional

    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    PIPELINE_TIMEOUT: int = 300

    # FIXED: Added missing Supabase config used by dataset_service
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "datasets"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
