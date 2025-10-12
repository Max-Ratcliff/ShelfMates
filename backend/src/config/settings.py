"""Application settings and configuration"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    environment: str = "development"
    port: int = 8000

    # Firebase
    firebase_project_id: str
    firebase_credentials_path: str | None = None  # Optional - Cloud Run uses default service account

    # CORS - can be comma-separated string or list
    allowed_origins: Union[str, List[str]] = ["http://localhost:8080", "http://localhost:5173"]

    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse ALLOWED_ORIGINS from comma-separated string or list"""
        if isinstance(v, str):
            # Remove any surrounding brackets and quotes, then split
            v = v.strip('[]').replace('"', '').replace("'", "")
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
