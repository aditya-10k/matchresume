import json
import logging
from typing import Dict, Any, Optional
from groq import Groq
from app.config import settings

logger = logging.getLogger("groq_client")


class GroqClient:
    """Wrapper around Groq API supporting structured output and dynamic BYOK."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key.strip() if api_key and api_key.strip() else settings.GROQ_API_KEY.strip()
        self.model = model.strip() if model and model.strip() else settings.GROQ_MODEL
        self._client: Optional[Groq] = None
        if self.api_key and self.api_key != "your-groq-api-key-here":
            try:
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
    ) -> Dict[str, Any]:
        """Calls Groq expecting a JSON response object. Fails explicitly if unconfigured or on error."""
        if not self._client:
            raise RuntimeError(
                "NO_GROQ_KEY: No valid Groq API key available. "
                "Please configure your Groq API key in Settings (get a free key at console.groq.com/keys)."
            )

        response = self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": f"{system_prompt}\n\nYou must return valid JSON only."},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
        )
        content = response.choices[0].message.content
        return json.loads(content)

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> str:
        """Calls Groq expecting a plain text / Markdown response."""
        if not self._client:
            raise RuntimeError(
                "NO_GROQ_KEY: No valid Groq API key available. "
                "Please configure your Groq API key in Settings (get a free key at console.groq.com/keys)."
            )

        response = self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content


def get_groq_client(api_key: Optional[str] = None, model: Optional[str] = None) -> GroqClient:
    """Factory helper returning a GroqClient configured with the resolved user key."""
    return GroqClient(api_key=api_key, model=model)


groq_client = GroqClient()
