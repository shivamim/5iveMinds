from app.core.message_board import MessageBoard

class Orchestrator:
    """Coordinates agent execution order and shared state."""
    def __init__(self):
        self.board = MessageBoard()
