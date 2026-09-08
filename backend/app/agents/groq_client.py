import json
import logging
import re
from typing import Dict, Any, Optional
from groq import Groq
from app.config import settings

logger = logging.getLogger("groq_client")


class GroqClient:
    """Wrapper around Groq API supporting structured output, dynamic BYOK, and reasoning model support."""

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
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Calls Groq expecting a JSON response object. Handles reasoning models and token caps gracefully."""
        if not self._client:
            raise RuntimeError(
                "NO_GROQ_KEY: No valid Groq API key available. "
                "Please configure your Groq API key in Settings (get a free key at console.groq.com/keys)."
            )

        # Map prompt-guard and placeholder models to standard Groq generation models
        effective_model = self.model
        if "prompt-guard" in self.model.lower():
            effective_model = "llama-3.3-70b-versatile"
        elif "gpt-oss" in self.model.lower():
            effective_model = "llama-3.3-70b-versatile"

        # Reasoning models (e.g. Qwen, DeepSeek) output <think> tokens which violate Groq proxy's json_object validator
        is_reasoning_model = any(m in effective_model.lower() for m in ["qwen", "deepseek", "think"])

        logger.info(f"GroqClient.generate_json dispatching to model '{effective_model}' (requested='{self.model}', reasoning={is_reasoning_model}, max_tokens={max_tokens})")
        kwargs: Dict[str, Any] = {
            "model": effective_model,
            "messages": [
                {"role": "system", "content": f"{system_prompt}\n\nYou must return a valid JSON object only without preamble."},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": temperature,
        }
        if is_reasoning_model:
            kwargs["reasoning_effort"] = "none"
        if max_tokens:
            kwargs["max_tokens"] = max_tokens

        try:
            response = self._client.chat.completions.create(**kwargs)
        except Exception as e:
            # Fallback if reasoning_effort is rejected by specific model
            if is_reasoning_model and "reasoning_effort" in kwargs:
                kwargs.pop("reasoning_effort", None)
                kwargs.pop("response_format", None)
                response = self._client.chat.completions.create(**kwargs)
            else:
                raise e

        raw_content = response.choices[0].message.content or ""

        # Clean thinking blocks from reasoning models if present
        cleaned = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        # Find first and last curly braces
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = cleaned[start_idx:end_idx + 1]
            return json.loads(json_str)

        return json.loads(cleaned)

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Calls Groq expecting a plain text / Markdown response."""
        if not self._client:
            raise RuntimeError(
                "NO_GROQ_KEY: No valid Groq API key available. "
                "Please configure your Groq API key in Settings (get a free key at console.groq.com/keys)."
            )

        # Map prompt-guard and placeholder models to standard Groq generation models
        effective_model = self.model
        if "prompt-guard" in self.model.lower():
            effective_model = "llama-3.3-70b-versatile"
        elif "gpt-oss" in self.model.lower():
            effective_model = "llama-3.3-70b-versatile"

        is_reasoning_model = any(m in effective_model.lower() for m in ["qwen", "deepseek", "think"])
        logger.info(f"GroqClient.generate_text dispatching to model '{effective_model}' (requested='{self.model}', max_tokens={max_tokens})")
        kwargs: Dict[str, Any] = {
            "model": effective_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }
        if is_reasoning_model:
            kwargs["reasoning_effort"] = "none"
        if max_tokens:
            kwargs["max_tokens"] = max_tokens

        try:
            response = self._client.chat.completions.create(**kwargs)
        except Exception as e:
            if is_reasoning_model and "reasoning_effort" in kwargs:
                kwargs.pop("reasoning_effort", None)
                response = self._client.chat.completions.create(**kwargs)
            else:
                raise e

        raw_content = response.choices[0].message.content or ""
        # Clean thinking blocks if present
        return re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()


def get_groq_client(api_key: Optional[str] = None, model: Optional[str] = None) -> GroqClient:
    """Factory helper returning a GroqClient configured with the resolved user key."""
    return GroqClient(api_key=api_key, model=model)


groq_client = GroqClient()
