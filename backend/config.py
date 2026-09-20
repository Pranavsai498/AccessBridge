import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"

    # Gemini is the primary and intended semantic model for AccessBridge.
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Retained for backwards-compatible environment files, but the form
    # workflow does not use these providers.
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEMO_PORT: int = 8080
    FRONTEND_PORT: int = 5173

    CONFIDENCE_THRESHOLD_HIGH: float = 0.85
    CONFIDENCE_THRESHOLD_MEDIUM: float = 0.65
    MANDATORY_CONFIRMATION_FOR_HIGH_RISK: bool = True

    DEFAULT_BROWSER_ENGINE: str = "playwright"
    HEADLESS_BROWSER: bool = True

    CHROMA_PERSIST_DIRECTORY: str = str(BASE_DIR / "data" / "chroma")
    AUDIT_DB_PATH: str = str(BASE_DIR / "data" / "audit.db")


settings = Settings()

os.makedirs(os.path.dirname(settings.AUDIT_DB_PATH), exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
