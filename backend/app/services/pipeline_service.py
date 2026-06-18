    # ==========================================
    # 🛡️ DB FETCHERS (CRASH-PROOF)
    # ==========================================
    async def get_history(self, limit: int = 20, offset: int = 0) -> List[PipelineRun]:
        result = await self.db.execute(select(PipelineRun).order_by(PipelineRun.started_at.desc()).offset(offset).limit(limit))
        return result.scalars().all()

    async def get_status(self, run_id: uuid.UUID) -> dict:
        run_res = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
        run = run_res.scalar_one_or_none()
        if not run: return None
        
        execs_res = await self.db.execute(select(AgentExecution).where(AgentExecution.run_id == run_id))
        execs = execs_res.scalars().all()
        
        # 🛡️ CRITICAL FIX: Convert ORM objects to plain dicts to prevent FastAPI infinite recursion!
        run_dict = {
            "id": str(run.id),
            "dataset_id": str(run.dataset_id),
            "dataset_name": run.dataset_name,
            "business_question": run.business_question,
            "status": run.status.value if hasattr(run.status, 'value') else str(run.status),
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "total_time_ms": run.total_time_ms,
            "quality_score_avg": run.quality_score_avg
        }
        
        execs_list = []
        for e in execs:
            execs_list.append({
                "id": str(e.id),
                "agent_name": e.agent_name,
                "status": e.status.value if hasattr(e.status, 'value') else str(e.status),
                "started_at": e.started_at.isoformat() if e.started_at else None,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None
            })
            
        completed_count = len([e for e in execs if (e.status.value if hasattr(e.status, 'value') else str(e.status)) == 'completed'])
        
        return {
            "run": run_dict, 
            "executions": execs_list, 
            "progress_percent": (completed_count / 5) * 100
        }

    async def get_results(self, run_id: uuid.UUID) -> dict:
        run_res = await self.db.execute(select(PipelineRun).where(PipelineRun.id == run_id))
        run = run_res.scalar_one_or_none()
        if not run: return None
        
        execs_res = await self.db.execute(select(AgentExecution).where(AgentExecution.run_id == run_id))
        execs = execs_res.scalars().all()
        
        run_dict = {
            "id": str(run.id),
            "dataset_id": str(run.dataset_id),
            "dataset_name": run.dataset_name,
            "business_question": run.business_question,
            "status": run.status.value if hasattr(run.status, 'value') else str(run.status),
        }
        
        executions_dict = {}
        for e in execs:
            executions_dict[e.agent_name] = e.output_data
            
        charts = executions_dict.get("designer", {}).get("charts", []) if "designer" in executions_dict else []
        
        return {
            "run": run_dict, 
            "executions": executions_dict, 
            "charts": charts, 
            "reports": []
        }
