from typing import Dict, Any

class MessageBoard:
    """Shared memory board for inter-agent communication."""
    def __init__(self):
        self._data: Dict[str, Any] = {}

    def post(self, key: str, value: Any):
        self._data[key] = value

    def get(self, key: str, default=None):
        return self._data.get(key, default)

    def all(self) -> Dict[str, Any]:
        return dict(self._data)
