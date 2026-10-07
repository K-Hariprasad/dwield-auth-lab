/**
 * Diagnostics & Session Activity Logger for Dwield Lab.
 * Enforces safe data redaction and correlates operations across test workflows.
 */

let listeners = [];
let logs = [];
let latestAssessment = null;
let latestPasskeyResult = null;
let stats = {
  successCount: 0,
  failureCount: 0,
  totalOperations: 0
};

/**
 * Recursively redacts sensitive security parameters before storing or rendering diagnostic data.
 */
export function redactSensitiveData(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Redact lengthy base64 payloads or bearer tokens if detected
    if (obj.length > 250 && !obj.includes(' ')) {
      return `${obj.substring(0, 15)}...[REDACTED BASE64 ${obj.length} BYTES]...${obj.substring(obj.length - 10)}`;
    }
    return obj;
  }

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  const redacted = {};
  const sensitiveKeys = [
    'password', 'privatekey', 'secret', 'signature',
    'rawassertion', 'authenticatordata', 'clientdatajson',
    'userhandle', 'encdata'
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      redacted[key] = `[REDACTED SENSITIVE DATA]`;
    } else {
      redacted[key] = redactSensitiveData(value);
    }
  }

  return redacted;
}

/**
 * Adds an operation entry to the in-memory session log.
 */
export function logActivity(operation, status, details = {}, correlationId = null, durationMs = null) {
  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    operation,
    status, // "SUCCESS" | "FAILED" | "WARNING" | "INFO" | "DENIED" | "CANCELLED"
    correlationId,
    durationMs,
    details: redactSensitiveData(details)
  };

  logs = [entry, ...logs].slice(0, 500); // Keep max 500 session entries

  stats.totalOperations += 1;
  if (status === 'SUCCESS' || status === 'ALLOW') {
    stats.successCount += 1;
  } else if (status === 'FAILED' || status === 'DENIED' || status === 'ERROR') {
    stats.failureCount += 1;
  }

  notifyListeners();
  return entry;
}

export function setLatestAssessment(assessment) {
  latestAssessment = redactSensitiveData(assessment);
  notifyListeners();
}

export function setLatestPasskeyResult(result) {
  latestPasskeyResult = redactSensitiveData(result);
  notifyListeners();
}

export function getLogs() {
  return [...logs];
}

export function getStats() {
  return { ...stats };
}

export function getLatestAssessment() {
  return latestAssessment;
}

export function getLatestPasskeyResult() {
  return latestPasskeyResult;
}

export function clearLogs() {
  logs = [];
  stats = { successCount: 0, failureCount: 0, totalOperations: 0 };
  notifyListeners();
}

export function subscribeLogs(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  const state = {
    logs: [...logs],
    stats: { ...stats },
    latestAssessment,
    latestPasskeyResult
  };
  listeners.forEach(l => l(state));
}
