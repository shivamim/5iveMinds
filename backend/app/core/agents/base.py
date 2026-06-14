from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.core.message_board import MessageBoard
import httpx
import json
import logging

logger = logging.getLogger(__name__)


async def call_groq(prompt: str, system: str = "You are a data analyst. Respond with valid JSON only.", max_tokens: int = 800) -> Optional[Dict]:
    """Call Groq API and return parsed JSON. Returns None on any failure."""
    try:
        from app.config import settings
        api_key = settings.GROQ_API_KEY
        if not api_key:
            return None

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama3-8b-8192",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.3,
                }
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
    except Exception as e:
        logger.warning(f"Groq call failed: {e}")
        return None


class BaseAgent(ABC):
    def __init__(self, message_board: MessageBoard):
        self.board = message_board

    @abstractmethod
    async def execute(self) -> Dict[str, Any]:
        pass

    @classmethod
    def get_config_schema(cls) -> Dict[str, Any]:
        return {}
