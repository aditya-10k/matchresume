from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Resume Copilot API"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./matchresume.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # LLM (Groq) - Environment-driven permitted models
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_MODELS: str = "openai/gpt-oss-120b,llama-3.3-70b-versatile,qwen/qwen3-32b"
    PERMITTED_MODELS: str = ""
    GROQ_MODEL_1: str = ""
    GROQ_MODEL_2: str = ""
    GROQ_MODEL_3: str = ""

    # LLM (OpenRouter) - Secondary / Failover Provider to combat rate limiting (429)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"

    def get_permitted_models(self) -> List[str]:
        """Returns the list of permitted LLM models configured via environment variables."""
        deprecated = {"qwen/qwen3.6-27b", "meta-llama/llama-prompt-guard-2-22m"}
        models: List[str] = []

        # 1. Explicit numbered slots (GROQ_MODEL_1, GROQ_MODEL_2, GROQ_MODEL_3)
        slot_models = [m.strip() for m in [self.GROQ_MODEL_1, self.GROQ_MODEL_2, self.GROQ_MODEL_3] if m and m.strip()]
        if slot_models:
            models.extend(slot_models)

        # 2. Comma-separated PERMITTED_MODELS or GROQ_MODELS
        raw_list_str = self.PERMITTED_MODELS.strip() if self.PERMITTED_MODELS and self.PERMITTED_MODELS.strip() else self.GROQ_MODELS
        if not models and raw_list_str:
            for item in raw_list_str.split(","):
                cleaned = item.strip()
                if cleaned and cleaned not in models:
                    models.append(cleaned)

        # 3. Ensure primary GROQ_MODEL is included at the front if valid and not a legacy deprecated default
        primary = self.GROQ_MODEL.strip() if self.GROQ_MODEL else ""
        if primary and primary not in deprecated and primary not in models:
            models.insert(0, primary)

        if not models:
            models = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3-32b"]

        return models

    def resolve_model(self, requested_model: str | None = None) -> str:
        """Resolves a requested model against permitted .env models, replacing deprecated IDs automatically."""
        permitted = self.get_permitted_models()
        if not requested_model or not requested_model.strip():
            return permitted[0]

        req = requested_model.strip()
        if req in permitted:
            return req

        # Map legacy / deprecated model IDs to corresponding permitted slots
        req_lower = req.lower()
        if "prompt-guard" in req_lower or "llama-3.1" in req_lower:
            return permitted[1] if len(permitted) > 1 else permitted[0]
        if "qwen3.6" in req_lower or "qwen" in req_lower:
            return permitted[2] if len(permitted) > 2 else permitted[0]

        return permitted[0]

    # Security & Auth
    JWT_SECRET_KEY: str = "matchresume-super-secret-jwt-key-change-in-prod-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENCRYPTION_KEY: str = "yR7gU_0wz3D5P9L6F2M8A4Q1J5X8T7K2N4V0Z3C6E9A="

    # RAG Settings
    CHROMA_PERSIST_DIR: str = "./chroma_data"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
