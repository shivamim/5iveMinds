from typing import Dict, Any

class MessageBoard:
    def __init__(self):
        self._messages: Dict[str, Any] = {}

    def post(self, channel: str, data: Any):
        self._messages[channel] = data

    def get(self, channel: str, default=None):
        return self._messages.get(channel, default)

    def has(self, channel: str) -> bool:
        return channel in self._messages
