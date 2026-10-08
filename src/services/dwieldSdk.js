/**
 * Dwield SDK Integration Adapter Service.
 * Serves as the single integration point between the React UI and `@dwield/device-biometrics-sdk`.
 * Components must interact with this adapter service rather than invoking SDK methods or endpoints directly.
 */

import {
  initDeviceInfoWithBiometrics,
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
  PasskeyError,
  PasskeyErrorCode
} from '@dwield/device-biometrics-sdk';
import { envConfig } from '../config/env.js';
import {
  logActivity,
  setLatestAssessment,
  setLatestPasskeyResult
} from './diagnostics.js';

let activeSdkInstance = null;
let activeConfig = null;

/**
 * Initializes the Dwield Device & Biometrics SDK with tenant configuration.
 */
export async function initializeSdk(customConfig = {}) {
  const startTime = performance.now();
  const config = {
    apiKey: customConfig.apiKey || envConfig.apiKey,
    passkeyServerUrl: customConfig.passkeyServerUrl || envConfig.passkeyServerUrl,
    userToken: customConfig.userToken || '',
    verbose: customConfig.verbose ?? true
  };

  try {
    const sdk = await initDeviceInfoWithBiometrics(config);
    
    // Automatically start behavioural biometrics listeners if available
    if (typeof sdk.initKeyStrokeDynamics === 'function') {
      sdk.initKeyStrokeDynamics();
    }
    if (typeof sdk.initMouseDynamics === 'function') {
      sdk.initMouseDynamics();
    }

    activeSdkInstance = sdk;
    activeConfig = config;

    const duration = Math.round(performance.now() - startTime);
    logActivity('SDK_INITIALIZATION', 'SUCCESS', {
      product: sdk.product,
      version: sdk.version,
      passkeyServerUrl: config.passkeyServerUrl
    }, null, duration);

    return { success: true, sdk, config };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    activeSdkInstance = null;
    activeConfig = null;

    logActivity('SDK_INITIALIZATION', 'FAILED', {
      error: error.message || 'SDK initialization failed',
      config: { ...config, apiKey: '***REDACTED***' }
    }, null, duration);

    throw error;
  }
}

export function isSdkInitialized() {
  return activeSdkInstance !== null;
}

export function getActiveSdk() {
  if (!activeSdkInstance) {
    throw new Error('Dwield SDK is not initialized. Please initialize the SDK first.');
  }
  return activeSdkInstance;
}

export function getActiveConfig() {
  return activeConfig;
}

/**
 * Diagnostic health check for the Passkey Server.
 */
export async function checkPasskeyServerHealth(overrideUrl = null) {
  const baseUrl = overrideUrl || activeConfig?.passkeyServerUrl || envConfig.passkeyServerUrl;
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  try {
    const liveRes = await fetch(`${cleanUrl}/health/live`, { method: 'GET' });
    const liveData = liveRes.ok ? await liveRes.json() : null;

    let readyData = null;
    try {
      const readyRes = await fetch(`${cleanUrl}/health/ready`, { method: 'GET' });
      readyData = readyRes.ok ? await readyRes.json() : null;
    } catch (e) {
      // Readiness check optional if database disconnected
    }

    const status = liveRes.ok ? 'SUCCESS' : 'FAILED';
    logActivity('PASSKEY_HEALTH_CHECK', status, {
      baseUrl: cleanUrl,
      live: liveData,
      ready: readyData
    });

    return {
      reachable: liveRes.ok,
      live: liveData?.status === 'ok',
      ready: readyData?.status === 'ready',
      raw: { liveData, readyData }
    };
  } catch (err) {
    logActivity('PASSKEY_HEALTH_CHECK', 'FAILED', {
      baseUrl: cleanUrl,
      error: err.message
    });
    return {
      reachable: false,
      live: false,
      ready: false,
      error: err.message
    };
  }
}

/**
 * Checks browser WebAuthn and platform authenticator support.
 */
export async function checkBrowserWebAuthnSupport() {
  const supported = isPasskeySupported();
  let platformAvailable = false;

  if (supported) {
    try {
      platformAvailable = await isPlatformAuthenticatorAvailable();
    } catch (e) {
      platformAvailable = false;
    }
  }

  return {
    isSupported: supported,
    isPlatformAvailable: platformAvailable
  };
}

/**
 * Collects device hardware, browser, and behavioural biometric signals.
 */
export async function collectDeviceSignals() {
  const startTime = performance.now();
  const sdk = getActiveSdk();

  try {
    const data = await sdk.getDeviceInfoWithBiometrics();
    const duration = Math.round(performance.now() - startTime);

    logActivity('COLLECT_DEVICE_SIGNALS', 'SUCCESS', {
      deviceOS: data.device?.osDetails?.osName,
      browser: data.device?.browserInfo?.browser_product,
      hasKeystrokeData: !!data.behavioural?.keystroke,
      hasMouseData: !!data.behavioural?.mouse
    }, null, duration);

    return data;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    logActivity('COLLECT_DEVICE_SIGNALS', 'FAILED', { error: err.message }, null, duration);
    throw err;
  }
}

/**
 * Normalizes and evaluates the risk engine suggestion field (case-insensitive).
 * Possible values:
 * 1. Good        -> ALLOW (No passkey verification needed)
 * 2. Accept      -> ALLOW (No passkey verification needed)
 * 3. Low Risky   -> ALLOW (No passkey verification needed)
 * 4. High        -> STEP_UP (Automatic passkey authentication required)
 * 5. Reject      -> DENY (Terminate flow, do not allow authentication)
 */
export function parseRiskSuggestion(rawSuggestion) {
  if (!rawSuggestion || typeof rawSuggestion !== 'string') return null;

  // Case-insensitive normalization, collapsing multiple spaces/hyphens
  const clean = rawSuggestion.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

  // 1. Good, 2. Accept, 3. Low Risky
  if (clean === 'good' || clean === 'accept' || clean === 'low risky' || clean === 'lowrisky') {
    return {
      raw: rawSuggestion,
      normalized: clean,
      decision: 'ALLOW',
      action: 'ALLOW',
      requiresPasskey: false,
      isRejected: false,
      label: rawSuggestion.trim(),
      description: 'Low risk detected. Passkey verification is bypassed.'
    };
  }

  // 4. High
  if (clean === 'high') {
    return {
      raw: rawSuggestion,
      normalized: clean,
      decision: 'STEP_UP',
      action: 'STEP_UP',
      requiresPasskey: true,
      isRejected: false,
      label: rawSuggestion.trim(),
      description: 'High risk detected. Automatic passkey authentication required.'
    };
  }

  // 5. Reject
  if (clean === 'reject') {
    return {
      raw: rawSuggestion,
      normalized: clean,
      decision: 'DENY',
      action: 'REJECT',
      requiresPasskey: false,
      isRejected: true,
      label: rawSuggestion.trim(),
      description: 'Authentication rejected by Risk Engine. Access prohibited.'
    };
  }

  return {
    raw: rawSuggestion,
    normalized: clean,
    decision: 'STEP_UP',
    action: 'STEP_UP',
    requiresPasskey: true,
    isRejected: false,
    label: rawSuggestion.trim(),
    description: `Risk suggestion "${rawSuggestion}". Passkey verification required.`
  };
}

/**
 * Executes Risk Score evaluation via the SDK.
 */
export async function evaluateRiskScore(userInfo, customApiKey = null) {
  const startTime = performance.now();
  const sdk = getActiveSdk();
  const activeCfg = getActiveConfig();

  const emailStr = typeof userInfo === 'string'
    ? userInfo
    : (userInfo?.email || userInfo?.userId || '');

  const effectiveApiKey = customApiKey || (typeof userInfo === 'object' ? userInfo?.apiKey : null) || activeCfg?.apiKey || envConfig.apiKey;

  const userPayload = {
    userId: emailStr,
    email: emailStr
  };

  try {
    let deviceSignals = null;
    try {
      deviceSignals = await sdk.getDeviceInfoWithBiometrics();
    } catch (e) {
      deviceSignals = null;
    }

    let result;
    if (effectiveApiKey && effectiveApiKey !== sdk.apiKey) {
      const originalApiKey = sdk.apiKey;
      sdk.apiKey = effectiveApiKey;
      try {
        result = await sdk.generateFingerPrint(userPayload);
      } finally {
        sdk.apiKey = originalApiKey;
      }
    } else {
      result = await sdk.generateFingerPrint(userPayload);
    }

    const duration = Math.round(performance.now() - startTime);

    // Extract suggestion from result (case-insensitive evaluation)
    const rawSuggestion = result?.suggestion || result?.data?.suggestion || null;
    const suggestionInfo = parseRiskSuggestion(rawSuggestion);

    let decision;
    if (suggestionInfo) {
      decision = suggestionInfo.decision;
    } else {
      // Legacy fallback
      const legacyDecision = result?.decision || result?.riskDecision || result?.modelResponse?.result?.recommended_action;
      if (legacyDecision) {
        const d = String(legacyDecision).toUpperCase();
        decision = (d === 'DENY' || d === 'REJECT') ? 'DENY' : (d === 'STEP_UP' || d === 'CHALLENGE') ? 'STEP_UP' : 'ALLOW';
      } else {
        decision = 'ALLOW';
      }
    }

    const effectiveSuggestion = rawSuggestion || (decision === 'ALLOW' ? 'Accept' : decision === 'DENY' ? 'Reject' : 'High');
    const effectiveSuggestionInfo = suggestionInfo || parseRiskSuggestion(effectiveSuggestion);
    const assessmentId = result?.assessmentId || result?.id || result?.assessment_id || `asm_${Date.now()}`;

    const enrichedResult = {
      ...result,
      suggestion: effectiveSuggestion,
      suggestionInfo: effectiveSuggestionInfo,
      decision,
      assessmentId,
      deviceSignals,
      riskScore: result?.riskScore ?? result?.data?.riskScore ?? result?.score,
      location: result?.location || result?.data?.location,
      machineId: result?.machineId || result?.data?.machineId,
      deviceId: result?.deviceId || result?.data?.deviceId,
      modelResponse: result?.modelResponse || result?.data?.modelResponse
    };

    setLatestAssessment(enrichedResult);
    logActivity('RISK_ASSESSMENT', decision === 'DENY' ? 'DENIED' : 'SUCCESS', enrichedResult, assessmentId, duration);

    return enrichedResult;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    logActivity('RISK_ASSESSMENT', 'FAILED', { error: err.message, userPayload }, null, duration);
    throw err;
  }
}

/**
 * Enrolls a new Passkey for a user identity.
 */
export async function enrollPasskey(options = {}) {
  const startTime = performance.now();
  const sdk = getActiveSdk();
  const activeCfg = getActiveConfig();

  const customApiKey = typeof options === 'object' ? options?.apiKey : null;
  const effectiveApiKey = customApiKey || activeCfg?.apiKey || envConfig.apiKey;

  const email = typeof options === 'string' ? options : (options?.email || options?.userName || options?.userId || '');
  const passkeyOptions = {
    ...(typeof options === 'object' ? options : {}),
    userToken: options?.userToken || email,
    userName: options?.userName || email,
  };

  try {
    let result;
    if (effectiveApiKey && effectiveApiKey !== sdk.apiKey) {
      const originalApiKey = sdk.apiKey;
      sdk.apiKey = effectiveApiKey;
      try {
        result = await sdk.registerPasskey(passkeyOptions);
      } finally {
        sdk.apiKey = originalApiKey;
      }
    } else {
      result = await sdk.registerPasskey(passkeyOptions);
    }

    const duration = Math.round(performance.now() - startTime);
    logActivity('PASSKEY_REGISTRATION', 'SUCCESS', result, result.credentialId, duration);
    return result;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    const isCancelled = err.code === PasskeyErrorCode.USER_CANCELLED;
    const status = isCancelled ? 'CANCELLED' : 'FAILED';

    logActivity('PASSKEY_REGISTRATION', status, {
      errorCode: err.code || 'UNKNOWN_ERROR',
      message: err.message,
      details: err.details
    }, null, duration);

    throw err;
  }
}

/**
 * Authenticates user via Passkey WebAuthn ceremony.
 */
export async function authenticatePasskey(options = {}) {
  const startTime = performance.now();
  const sdk = getActiveSdk();
  const activeCfg = getActiveConfig();

  const customApiKey = typeof options === 'object' ? options?.apiKey : null;
  const effectiveApiKey = customApiKey || activeCfg?.apiKey || envConfig.apiKey;

  const email = typeof options === 'string' ? options : (options?.email || options?.userName || options?.userId || '');
  const passkeyOptions = {
    ...(typeof options === 'object' ? options : {}),
    userToken: options?.userToken || email,
  };

  try {
    let result;
    if (effectiveApiKey && effectiveApiKey !== sdk.apiKey) {
      const originalApiKey = sdk.apiKey;
      sdk.apiKey = effectiveApiKey;
      try {
        result = await sdk.authenticatePasskey(passkeyOptions);
      } finally {
        sdk.apiKey = originalApiKey;
      }
    } else {
      result = await sdk.authenticatePasskey(passkeyOptions);
    }

    const duration = Math.round(performance.now() - startTime);
    setLatestPasskeyResult(result);
    logActivity('PASSKEY_AUTHENTICATION', 'SUCCESS', result, options.assessmentId || result.credentialId, duration);

    return result;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    const isCancelled = err.code === PasskeyErrorCode.USER_CANCELLED;
    const isDenied = err.code === PasskeyErrorCode.RISK_DENIED;
    const status = isCancelled ? 'CANCELLED' : isDenied ? 'DENIED' : 'FAILED';

    logActivity('PASSKEY_AUTHENTICATION', status, {
      errorCode: err.code || 'AUTHENTICATION_FAILED',
      message: err.message,
      assessmentId: options.assessmentId,
      details: err.details
    }, options.assessmentId, duration);

    throw err;
  }
}


/**
 * Runs Adaptive Authentication pipeline connecting Risk Engine output to Passkey Step-Up.
 * 
 * Rules based on Risk Engine suggestion (case-insensitive):
 * 1-3. "Good", "Accept", "Low Risky": Passkey verification bypassed. Access allowed directly.
 * 4.   "High": Passkey authentication automatically triggered and verified.
 * 5.   "Reject": Authentication strictly prohibited. Flow terminated with error message.
 */
export async function runAdaptiveAuthenticationPipeline(userInfo, passkeyOptions = {}) {
  const startTime = performance.now();
  const sdk = getActiveSdk();

  const emailStr = typeof userInfo === 'string'
    ? userInfo
    : (userInfo?.email || userInfo?.userId || '');

  const customApiKey = typeof userInfo === 'object' ? userInfo?.apiKey : (passkeyOptions?.apiKey || null);

  const payload = { userId: emailStr, email: emailStr, apiKey: customApiKey };

  try {
    // 0. Collect device & biometrics signals
    let deviceSignals = null;
    try {
      deviceSignals = await collectDeviceSignals();
    } catch (e) {
      deviceSignals = null;
    }

    // 1. Collect signals & evaluate risk score from Risk API
    let riskAssessment = null;
    try {
      riskAssessment = await evaluateRiskScore(payload, customApiKey);
      if (!riskAssessment.deviceSignals && deviceSignals) {
        riskAssessment.deviceSignals = deviceSignals;
      }
    } catch (e) {
      riskAssessment = {
        assessmentId: `asm_${Date.now()}`,
        decision: 'STEP_UP',
        suggestion: 'High',
        riskScore: 0.5,
        deviceSignals,
        error: e.message
      };
    }

    const assessmentId = riskAssessment.assessmentId;
    const suggestion = riskAssessment.suggestion || '';
    const suggestionInfo = riskAssessment.suggestionInfo || parseRiskSuggestion(suggestion) || {
      decision: riskAssessment.decision || 'STEP_UP',
      requiresPasskey: true,
      isRejected: false
    };
    const decision = suggestionInfo.decision;

    // RULE 5: Reject -> Terminate flow, do not allow authentication
    if (decision === 'DENY' || suggestionInfo.isRejected) {
      const duration = Math.round(performance.now() - startTime);
      const denyError = new Error(
        `Authentication rejected: Risk Engine suggestion is "${suggestion || 'Reject'}". Access is strictly prohibited.`
      );
      denyError.code = 'RISK_DENIED';
      denyError.suggestion = suggestion || 'Reject';
      denyError.decision = 'DENY';
      denyError.assessmentId = assessmentId;
      denyError.riskAssessment = riskAssessment;

      logActivity('ADAPTIVE_AUTHENTICATION_PIPELINE', 'DENIED', {
        email: emailStr,
        suggestion: suggestion || 'Reject',
        riskDecision: 'DENY',
        assessmentId,
        reason: 'Terminated: Risk Engine evaluated Reject policy'
      }, assessmentId, duration);

      throw denyError;
    }

    // RULES 1-3: Good / Accept / Low Risky -> Bypass passkey verification
    if (decision === 'ALLOW' || !suggestionInfo.requiresPasskey) {
      const duration = Math.round(performance.now() - startTime);
      const bypassPasskeyResult = {
        success: true,
        verified: true,
        bypassPasskey: true,
        decision: 'ALLOW',
        suggestion: suggestion || 'Accept',
        reason: `Passkey verification bypassed because risk suggestion is "${suggestion || 'Accept'}".`
      };

      setLatestPasskeyResult(bypassPasskeyResult);

      logActivity('ADAPTIVE_AUTHENTICATION_PIPELINE', 'SUCCESS', {
        email: emailStr,
        suggestion: suggestion || 'Accept',
        riskDecision: 'ALLOW',
        bypassPasskey: true,
        assessmentId
      }, assessmentId, duration);

      return {
        deviceSignals: deviceSignals || riskAssessment?.deviceSignals,
        riskAssessment,
        passkeyResult: bypassPasskeyResult,
        decision: 'ALLOW',
        suggestion: suggestion || 'Accept',
        bypassPasskey: true,
        message: `Passkey verification bypassed (Suggestion: ${suggestion || 'Accept'}). Authentication allowed directly.`
      };
    }

    // RULE 4: High -> Automatically give passkey authentication
    const passkeyResult = await authenticatePasskey({
      ...passkeyOptions,
      apiKey: customApiKey,
      email: emailStr,
      userToken: emailStr,
      riskDecision: 'STEP_UP',
      assessmentId
    });

    const duration = Math.round(performance.now() - startTime);
    const finalStatus = passkeyResult.success ? 'SUCCESS' : 'FAILED';

    logActivity('ADAPTIVE_AUTHENTICATION_PIPELINE', finalStatus, {
      email: emailStr,
      apiKey: customApiKey ? 'Custom Key Provided' : 'Default Key',
      suggestion: suggestion || 'High',
      riskDecision: 'STEP_UP',
      assessmentId,
      passkeyResult
    }, assessmentId, duration);

    return {
      deviceSignals: deviceSignals || riskAssessment?.deviceSignals,
      riskAssessment,
      passkeyResult,
      decision: 'STEP_UP',
      suggestion: suggestion || 'High',
      stepUpVerificationToken: passkeyResult?.stepUpVerificationToken
    };
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    logActivity('ADAPTIVE_AUTHENTICATION_PIPELINE', 'FAILED', {
      error: err.message,
      code: err.code,
      suggestion: err.suggestion
    }, null, duration);
    throw err;
  }
}

/**
 * Lists registered credentials for a user.
 */
export async function listPasskeys(userToken) {
  const startTime = performance.now();
  const sdk = getActiveSdk();
  const effectiveToken = userToken || activeConfig?.userToken || '';

  try {
    const credentials = await sdk.listPasskeys({ userToken: effectiveToken });
    const duration = Math.round(performance.now() - startTime);

    logActivity('LIST_PASSKEYS', 'SUCCESS', { count: credentials.length }, null, duration);
    return credentials;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    logActivity('LIST_PASSKEYS', 'FAILED', { error: err.message }, null, duration);
    throw err;
  }
}

/**
 * Revokes a registered credential by ID.
 */
export async function revokePasskey(credentialId, userToken) {
  const startTime = performance.now();
  const sdk = getActiveSdk();
  const effectiveToken = userToken || activeConfig?.userToken || '';

  try {
    const result = await sdk.revokePasskey(credentialId, { userToken: effectiveToken });
    const duration = Math.round(performance.now() - startTime);

    logActivity('REVOKE_PASSKEY', 'SUCCESS', result, credentialId, duration);
    return result;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    logActivity('REVOKE_PASSKEY', 'FAILED', { credentialId, error: err.message }, credentialId, duration);
    throw err;
  }
}
