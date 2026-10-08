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

    const decision = result?.decision || result?.riskDecision || 'ALLOW';
    const assessmentId = result?.assessmentId || result?.id || result?.assessment_id || `asm_${Date.now()}`;

    const enrichedResult = {
      ...result,
      decision,
      assessmentId,
      deviceSignals
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
        riskScore: 0.5,
        deviceSignals,
        error: e.message
      };
    }

    const assessmentId = riskAssessment.assessmentId;
    const decision = 'STEP_UP'; // Everything is forced to STEP_UP for now per requirement

    // 2. Initiate passkey step-up authentication using email & API key header and verify passkey
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
      riskDecision: decision,
      originalRiskDecision: riskAssessment?.rawRiskDecision || riskAssessment?.decision,
      assessmentId,
      passkeyResult
    }, assessmentId, duration);

    return {
      deviceSignals: deviceSignals || riskAssessment?.deviceSignals,
      riskAssessment: {
        ...riskAssessment,
        decision,
        rawRiskDecision: riskAssessment?.decision
      },
      passkeyResult,
      decision,
      stepUpVerificationToken: passkeyResult?.stepUpVerificationToken
    };
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    logActivity('ADAPTIVE_AUTHENTICATION_PIPELINE', 'FAILED', {
      error: err.message,
      code: err.code
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
