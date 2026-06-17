from typing import List, Dict, Any
from app.core.message_board import MessageBoard

class Orchestrator:
    def __init__(self):
        self.board = MessageBoard()

    def run_pipeline(self, agents: List[Any]) -> Dict[str, Any]:
        results = {}
        for agent_name, agent in agents:
            result = agent.execute()
            self.board.post(agent_name, result)
            results[agent_name] = result
        return results
