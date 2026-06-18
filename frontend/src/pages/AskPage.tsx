  const handleSubmit = async () => {
    const q = question.trim();
    if (!q) { setError('Please provide a business question.'); return; }
    // ✅ FIXED: Enforce backend min_length=10
    if (q.length < 10) { setError('Question must be at least 10 characters.'); return; }

    const datasetId = localStorage.getItem('lastDatasetId');
    if (!datasetId) { setError('No dataset found. Please upload a file first.'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      // ✅ FIXED: Send business_question (not goal/query) to match backend
      const pipelineResponse = await startPipeline({
        dataset_id: datasetId,
        business_question: q,
      });
      const runId = pipelineResponse.id || (pipelineResponse as any).run_id;
      if (!runId) throw new Error('Backend did not return a run ID');
      localStorage.setItem('lastRunId', runId);
      navigate(`/dashboard?run=${runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start pipeline');
    } finally {
      setIsProcessing(false);
    }
  };
