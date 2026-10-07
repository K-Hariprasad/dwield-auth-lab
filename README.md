# Dwield Lab — Adaptive Authentication & Device Risk Testing

An enterprise developer testing dashboard built with **React.js (JavaScript only)** and **Vite** to exercise and validate the `@dwield/device-biometrics-sdk` package and the **Dwield Passkey Server**.

---

## 1. Feature Availability Matrix

| Feature Module | Integration Status | Supported Capabilities |
| :--- | :--- | :--- |
| **Overview Dashboard** | Fully Supported | Live SDK initialization status, backend health readiness, operational session counters, activity log stream. |
| **Device Signals** | Fully Supported | Hardware fingerprinting, browser metrics, OS detection, incognito status, WebAudio API frequency hash, Canvas hash, keystroke & mouse biometrics listeners. |
| **Risk Assessment** | Fully Supported | Form interface invoking `generateFingerPrint(userInfo)` via SDK to send payload to Risk Score API (`https://testweb.dwield.ai:8762/risk-score`). |
| **Passkey Enrollment** | Fully Supported | WebAuthn passkey registration ceremony calling Passkey Server (`/v1/passkeys/registration/*`) via SDK `registerPasskey()`. |
| **Passkey Authentication** | Fully Supported | WebAuthn passkey assertion ceremony calling Passkey Server (`/v1/passkeys/authentication/*`) via SDK `authenticatePasskey()`. |
| **Adaptive Authentication** | Fully Supported | Primary end-to-end pipeline connecting risk decision (`ALLOW`, `STEP_UP`, `DENY`) with WebAuthn step-up session binding and token verification. |
| **Speech & Biometrics** | Integration Required | Explains technical difference between WebAudio API hardware fingerprinting (`audio_fingerprint.js`) vs voice recognition biometrics. |
| **Credential Management** | Fully Supported | Query enrolled credentials (`listPasskeys()`) and revoke credential (`revokePasskey()`). |
| **Test Scenarios** | Fully Supported | 16 automated and interactive test scenarios validating initialization, error handling, session mismatch, cancellation, and DENY enforcement. |
| **Activity Logs** | Fully Supported | Session-level diagnostic audit trail with operation/status filtering, JSON payload viewer, and sensitive data redaction. |
| **Configuration** | Fully Supported | Live tenant API key manager, Passkey Server base URL configuration, and Vite environment settings. |

---

## 2. Quick Start & Development Setup

### Prerequisites
* Node.js (v18+)
* Dwield Passkey Server running on `http://localhost:3000` (optional for offline testing, required for WebAuthn server verification)

### Installation
```bash
# Clone or navigate to Auth Lab
cd "d:\Work\Dwield\Auth Lab"

# Install dependencies (links local @dwield/device-biometrics-sdk package)
npm install
```

### Running the Application
```bash
# Start Vite local development server (http://localhost:5173)
npm run dev
```

### Running Unit & Integration Tests
```bash
# Execute Vitest test suite
npm test
```

### Production Build Verification
```bash
# Build optimized static bundle
npm run build
```

---

## 3. SDK Method to UI Component Mapping

| SDK Export / Method | React UI Page / Service Component |
| :--- | :--- |
| `initDeviceInfoWithBiometrics(config)` | `src/services/dwieldSdk.js` $\rightarrow$ `initializeSdk()` |
| `getDeviceInfoWithBiometrics()` | `src/pages/DeviceSignalsPage.jsx` |
| `generateFingerPrint(userInfo)` | `src/pages/RiskAssessmentPage.jsx` |
| `registerPasskey(options, config)` | `src/pages/PasskeyEnrollmentPage.jsx` |
| `authenticatePasskey(options, config)` | `src/pages/PasskeyAuthenticationPage.jsx` |
| `evaluateAndAuthenticate(userInfo, options)` | `src/pages/AdaptiveAuthenticationPage.jsx` |
| `listPasskeys(options)` | `src/pages/CredentialsPage.jsx` |
| `revokePasskey(credentialId, options)` | `src/pages/CredentialsPage.jsx` |

---

## 4. Environment Variables (`.env`)

```env
# Dwield Passkey Server base URL
VITE_PASSKEY_SERVER_URL=http://localhost:3000

# Default tenant API key for SDK initialization
VITE_DWIELD_API_KEY=test-tenant-api-key-12345

# Dwield Risk Engine endpoint URL
VITE_RISK_ENGINE_URL=https://testweb.dwield.ai:8762
```

---

## 5. Security & Redaction Standards
* Private keys, passwords, bearer tokens, raw WebAuthn assertions (`clientDataJSON`, `signature`, `userHandle`) are automatically redacted in diagnostics and logs using `redactSensitiveData()`.
* Browser-embedded API keys in Vite environment files are treated as public tenant identifiers.
* No server-side secrets or MongoDB connection URIs are stored in client code.
