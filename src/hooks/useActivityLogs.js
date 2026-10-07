import { useState, useEffect } from 'react';
import {
  getLogs,
  getStats,
  getLatestAssessment,
  getLatestPasskeyResult,
  subscribeLogs,
  clearLogs
} from '../services/diagnostics.js';

export function useActivityLogs() {
  const [logs, setLogs] = useState(getLogs());
  const [stats, setStats] = useState(getStats());
  const [latestAssessment, setLatestAssessmentState] = useState(getLatestAssessment());
  const [latestPasskeyResult, setLatestPasskeyResultState] = useState(getLatestPasskeyResult());

  useEffect(() => {
    const unsubscribe = subscribeLogs(state => {
      setLogs(state.logs);
      setStats(state.stats);
      setLatestAssessmentState(state.latestAssessment);
      setLatestPasskeyResultState(state.latestPasskeyResult);
    });

    return unsubscribe;
  }, []);

  return {
    logs,
    stats,
    latestAssessment,
    latestPasskeyResult,
    clearLogs
  };
}
