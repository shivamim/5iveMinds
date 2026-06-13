from abc import ABC, abstractmethod
from typing import Dict, Any
from app.core.message_board import MessageBoard

class BaseAgent(ABC):
    def __init__(self, message_board: MessageBoard):
        self.board = message_board

    @abstractmethod
    async def execute(self) -> Dict[str, Any]:
        pass

    @classmethod
    def get_config_schema(cls) -> Dict[str, Any]:
        return {}
