/**
 * Environment configuration helper for Dwield Lab.
 * Reads Vite environment variables without exposing server secrets.
 */

export const envConfig = {
  passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL || 'http://localhost:3000',
  apiKey: import.meta.env.VITE_DWIELD_API_KEY || '',
  riskEngineUrl: import.meta.env.VITE_RISK_ENGINE_URL || 'https://testweb.dwield.ai:8762',
  environment: import.meta.env.MODE || 'development'
};

export const getPasskeyServerUrl = () => envConfig.passkeyServerUrl;
export const getApiKey = () => envConfig.apiKey;
export const getRiskEngineUrl = () => envConfig.riskEngineUrl;
