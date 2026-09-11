import json
import logging
import re
from typing import Dict, Any, Optional
import httpx
from groq import Groq, RateLimitError
from app.config import settings
from app.utils.text_sanitizer import strip_asterisks

logger = logging.getLogger("groq_client")


class GroqClient:
    """
    Multi-Provider LLM Client supporting:
    1. Primary: Groq API (structured JSON output, dynamic BYOK, reasoning model support).
    2. Failover: OpenRouter API (automatic fallback on Groq 429 rate limit or capacity exhaustion).
    3. Strict zero-asterisk output guarantee.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        openrouter_api_key: Optional[str] = None,
        openrouter_model: Optional[str] = None,
    ):
        self.api_key = api_key.strip() if api_key and api_key.strip() else settings.GROQ_API_KEY.strip()
        self.model = model.strip() if model and model.strip() else settings.GROQ_MODEL
        self.openrouter_api_key = (
            openrouter_api_key.strip()
            if openrouter_api_key and openrouter_api_key.strip()
            else settings.OPENROUTER_API_KEY.strip()
        )
        self.openrouter_model = (
            openrouter_model.strip()
            if openrouter_model and openrouter_model.strip()
            else settings.OPENROUTER_MODEL.strip()
        )
        self.last_provider_used: str = "groq"
        self._client: Optional[Groq] = None

        if self.api_key and self.api_key != "your-groq-api-key-here":
            try:
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

    @property
    def is_configured(self) -> bool:
        return (self._client is not None) or bool(self.openrouter_api_key)

    def _is_rate_limit_error(self, exc: Exception) -> bool:
        """Determines if an exception is an HTTP 429 or quota/rate limit error."""
        if isinstance(exc, RateLimitError):
            return True
        msg = str(exc).lower()
        return any(
            phrase in msg
            for phrase in [
                "429",
                "rate limit",
                "rate_limit",
                "too many requests",
                "quota exceeded",
                "tokens per minute",
                "requests per minute",
                "tpm",
                "rpm",
            ]
        )

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Calls Groq expecting a JSON response object, falling back to OpenRouter on rate-limit (429)."""
        # 1. Try Groq if client is initialized
        if self._client:
            effective_model = self.model
            if "prompt-guard" in self.model.lower():
                effective_model = "llama-3.1-8b-instant"

            is_reasoning_model = any(m in effective_model.lower() for m in ["qwen", "deepseek", "think"])

            logger.info(
                f"GroqClient.generate_json dispatching to Groq model '{effective_model}' "
                f"(requested='{self.model}', reasoning={is_reasoning_model}, max_tokens={max_tokens})"
            )
            kwargs: Dict[str, Any] = {
                "model": effective_model,
                "messages": [
                    {
                        "role": "system",
                        "content": f"{system_prompt}\n\nYou must return a valid JSON object only without preamble or markdown fences.",
                    },
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
                raw_content = response.choices[0].message.content or ""
                self.last_provider_used = "groq"
                parsed = self._extract_json(raw_content)
                return strip_asterisks(parsed)
            except Exception as e:
                # If it's a reasoning_effort rejection by Groq, retry once with standard parameters
                if is_reasoning_model and "reasoning_effort" in kwargs:
                    try:
                        kwargs.pop("reasoning_effort", None)
                        kwargs.pop("response_format", None)
                        response = self._client.chat.completions.create(**kwargs)
                        raw_content = response.choices[0].message.content or ""
                        self.last_provider_used = "groq"
                        parsed = self._extract_json(raw_content)
                        return strip_asterisks(parsed)
                    except Exception as retry_exc:
                        e = retry_exc

                if self.openrouter_api_key:
                    logger.warning(
                        f"Groq API call failed ({type(e).__name__}: {e}). "
                        f"Failing over to OpenRouter ({self.openrouter_model})..."
                    )
                    return self._generate_json_openrouter(
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                raise e

        # 2. No Groq key provided -> use OpenRouter directly if configured
        if self.openrouter_api_key:
            logger.info(f"No Groq key available; routing generate_json directly to OpenRouter ({self.openrouter_model})")
            return self._generate_json_openrouter(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        raise RuntimeError(
            "NO_LLM_KEY: Neither Groq API key nor OpenRouter API key is configured. "
            "Please configure your API key in Settings (Groq at console.groq.com/keys or OpenRouter)."
        )

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Calls Groq expecting a plain text response, falling back to OpenRouter on rate-limit (429)."""
        # 1. Try Groq if client is initialized
        if self._client:
            effective_model = self.model
            if "prompt-guard" in self.model.lower():
                effective_model = "llama-3.1-8b-instant"

            is_reasoning_model = any(m in effective_model.lower() for m in ["qwen", "deepseek", "think"])
            logger.info(
                f"GroqClient.generate_text dispatching to Groq model '{effective_model}' "
                f"(requested='{self.model}', max_tokens={max_tokens})"
            )
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
                raw_content = response.choices[0].message.content or ""
                self.last_provider_used = "groq"
                cleaned = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
                return strip_asterisks(cleaned)
            except Exception as e:
                if is_reasoning_model and "reasoning_effort" in kwargs:
                    try:
                        kwargs.pop("reasoning_effort", None)
                        response = self._client.chat.completions.create(**kwargs)
                        raw_content = response.choices[0].message.content or ""
                        self.last_provider_used = "groq"
                        cleaned = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
                        return strip_asterisks(cleaned)
                    except Exception as retry_exc:
                        e = retry_exc

                if self.openrouter_api_key:
                    logger.warning(
                        f"Groq API call failed ({type(e).__name__}: {e}). "
                        f"Failing over to OpenRouter ({self.openrouter_model})..."
                    )
                    return self._generate_text_openrouter(
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                raise e

        # 2. No Groq key provided -> use OpenRouter directly if configured
        if self.openrouter_api_key:
            logger.info(f"No Groq key available; routing generate_text directly to OpenRouter ({self.openrouter_model})")
            return self._generate_text_openrouter(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        raise RuntimeError(
            "NO_LLM_KEY: Neither Groq API key nor OpenRouter API key is configured. "
            "Please configure your API key in Settings (Groq at console.groq.com/keys or OpenRouter)."
        )

    def _generate_json_openrouter(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.0,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Calls OpenRouter API requesting structured JSON output."""
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://matchresume.ai",
            "X-Title": "matchresume",
        }
        payload: Dict[str, Any] = {
            "model": self.openrouter_model,
            "messages": [
                {
                    "role": "system",
                    "content": f"{system_prompt}\n\nYou must return a valid JSON object only without preamble or markdown fences.",
                },
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        with httpx.Client(timeout=45.0) as client:
            resp = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            # If 400 because response_format is unsupported by the model, retry without response_format
            if resp.status_code == 400 and "response_format" in resp.text:
                payload.pop("response_format", None)
                resp = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )

            resp.raise_for_status()
            data = resp.json()
            raw_content = data["choices"][0]["message"]["content"] or ""
            self.last_provider_used = "openrouter"
            parsed = self._extract_json(raw_content)
            return strip_asterisks(parsed)

    def _generate_text_openrouter(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Calls OpenRouter API requesting plain text output."""
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://matchresume.ai",
            "X-Title": "matchresume",
        }
        payload: Dict[str, Any] = {
            "model": self.openrouter_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }
        if max_tokens:
            payload["max_tokens"] = max_tokens

        with httpx.Client(timeout=45.0) as client:
            resp = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            raw_content = data["choices"][0]["message"]["content"] or ""
            self.last_provider_used = "openrouter"
            cleaned = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
            return strip_asterisks(cleaned)

    def _extract_json(self, raw_content: str) -> Dict[str, Any]:
        """Extracts and parses JSON from raw LLM output, removing markdown blocks and thinking tokens."""
        cleaned = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = cleaned[start_idx : end_idx + 1]
            return json.loads(json_str)

        return json.loads(cleaned)


def get_groq_client(
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    openrouter_api_key: Optional[str] = None,
    openrouter_model: Optional[str] = None,
) -> GroqClient:
    """Factory helper returning a GroqClient configured with the resolved keys."""
    return GroqClient(
        api_key=api_key,
        model=model,
        openrouter_api_key=openrouter_api_key,
        openrouter_model=openrouter_model,
    )


groq_client = GroqClient()
