import json
import logging
from typing import List, Dict, Any, Optional
from groq import Groq
from app.config import settings

logger = logging.getLogger("groq_client")


class GroqClient:
    """Wrapper around Groq API supporting structured output and fallbacks."""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self._client: Optional[Groq] = None
        if self.api_key and self.api_key.strip() and self.api_key != "your-groq-api-key-here":
            try:
                self._client = Groq(api_key=self.api_key.strip())
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_data: Optional[Dict[str, Any]] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        """Calls Groq expecting a JSON response object."""
        if not self._client:
            logger.info("Groq API key not configured. Using deterministic extraction fallback.")
            return fallback_data or {}

        try:
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
        except Exception as e:
            logger.error(f"Groq API call error: {e}")
            if fallback_data is not None:
                return fallback_data
            raise


groq_client = GroqClient()
