"""Application settings and configuration"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    environment: str = "development"
    port: int = 8000

    # Firebase
    firebase_project_id: str
    firebase_credentials_path: str = "./serviceAccountKey.json"

    # CORS
    allowed_origins: List[str] = ["http://localhost:8080", "http://localhost:5173"]

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
