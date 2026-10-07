import fs from 'fs';

const indexPath = "D:/Work/Dwield/dwield-sdk/src/passkey/index.js";
let indexContent = fs.readFileSync(indexPath, "utf8");

// Replace registerPasskey function
const newRegisterFunc = `export async function registerPasskey(options = {}, config = {}) {
  const userEmail = typeof options === 'string' ? options : (options.email || options.userName || options.userEmail || options.userToken);

  if (!userEmail) {
    throw new PasskeyError(
      "User email is required for passkey enrollment",
      PasskeyErrorCode.INVALID_RESPONSE
    );
  }

  if (!isPasskeySupported()) {
    throw new PasskeyError(
      "WebAuthn passkeys are not supported by this browser environment",
      PasskeyErrorCode.NOT_SUPPORTED
    );
  }

  // Step 1: Request Registration Options (POST /v1/passkeys/registration/options { email })
  const serverOptionsRes = await passkeyFetch(
    "/v1/passkeys/registration/options",
    {
      method: "POST",
      body: { email: userEmail },
      skipUserToken: true,
    },
    config
  );

  const ceremonyId = serverOptionsRes?.ceremonyId || serverOptionsRes?.data?.ceremonyId;
  const optionsJSON = serverOptionsRes?.options || serverOptionsRes?.data?.options;

  if (!ceremonyId || !optionsJSON) {
    throw new PasskeyError(
      "Malformed registration options response from server",
      PasskeyErrorCode.INVALID_RESPONSE,
      serverOptionsRes
    );
  }

  // Step 2: Trigger WebAuthn Browser Prompt
  let registrationResponse;
  try {
    registrationResponse = await startRegistration({ optionsJSON });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
      throw new PasskeyError(
        "Passkey registration was cancelled by the user or timed out",
        PasskeyErrorCode.USER_CANCELLED,
        { originalError: err.message }
      );
    }
    if (err.name === 'InvalidStateError') {
      throw new PasskeyError(
        "A passkey credential already exists for this device/user",
        PasskeyErrorCode.VERIFICATION_FAILED,
        { originalError: err.message }
      );
    }

    throw new PasskeyError(
      \`WebAuthn browser registration failed: \${err.message}\`,
      PasskeyErrorCode.VERIFICATION_FAILED,
      { originalError: err.message }
    );
  }

  // Step 3: Verify Registration Assertion (POST /v1/passkeys/registration/verify { ceremonyId, response })
  const verifyRes = await passkeyFetch(
    "/v1/passkeys/registration/verify",
    {
      method: "POST",
      body: {
        ceremonyId,
        response: registrationResponse,
      },
      skipUserToken: true,
    },
    config
  );

  const verified = verifyRes?.verified ?? verifyRes?.data?.verified ?? (verifyRes?.status === "success");
  const credentialId = verifyRes?.credentialId || verifyRes?.data?.credentialId;

  if (!verified) {
    throw new PasskeyError(
      "Server-side passkey verification failed",
      PasskeyErrorCode.VERIFICATION_FAILED,
      verifyRes
    );
  }

  return {
    status: verifyRes?.status || "success",
    verified: true,
    credentialId,
    rawServerResponse: verifyRes,
  };
}`;

const newAuthFunc = `export async function authenticatePasskey(options = {}, config = {}) {
  const userEmail = typeof options === 'string' ? options : (options.email || options.userName || options.userEmail || options.userToken);

  const riskDecision = typeof options === 'object' ? options.riskDecision : undefined;

  if (riskDecision === "ALLOW") {
    return {
      status: "success",
      success: true,
      verified: true,
      decision: "ALLOW",
      bypassPasskey: true,
      message: "Access allowed by risk engine; passkey step-up not required.",
    };
  }

  if (riskDecision === "DENY") {
    throw new PasskeyError(
      "Risk assessment decision is DENY. Step-up passkey authentication is strictly prohibited.",
      PasskeyErrorCode.RISK_DENIED
    );
  }

  if (!isPasskeySupported()) {
    throw new PasskeyError(
      "WebAuthn passkeys are not supported by this browser environment",
      PasskeyErrorCode.NOT_SUPPORTED
    );
  }

  if (!userEmail) {
    throw new PasskeyError(
      "User email is required for passkey authentication",
      PasskeyErrorCode.INVALID_RESPONSE
    );
  }

  // Step 1: Request Authentication Options (POST /v1/passkeys/authentication/options { email })
  const serverAuthOptionsRes = await passkeyFetch(
    "/v1/passkeys/authentication/options",
    {
      method: "POST",
      body: { email: userEmail },
      skipUserToken: true,
    },
    config
  );

  const ceremonyId = serverAuthOptionsRes?.ceremonyId || serverAuthOptionsRes?.data?.ceremonyId;
  const optionsJSON = serverAuthOptionsRes?.options || serverAuthOptionsRes?.data?.options;

  if (!ceremonyId || !optionsJSON) {
    throw new PasskeyError(
      "Malformed authentication options response from server",
      PasskeyErrorCode.INVALID_RESPONSE,
      serverAuthOptionsRes
    );
  }

  // Step 2: Trigger WebAuthn Browser Prompt
  let assertionResponse;
  try {
    assertionResponse = await startAuthentication({ optionsJSON });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
      throw new PasskeyError(
        "Passkey authentication was cancelled by the user or timed out",
        PasskeyErrorCode.USER_CANCELLED,
        { originalError: err.message }
      );
    }

    throw new PasskeyError(
      \`WebAuthn browser authentication failed: \${err.message}\`,
      PasskeyErrorCode.VERIFICATION_FAILED,
      { originalError: err.message }
    );
  }

  // Step 3: Verify Authentication Assertion (POST /v1/passkeys/authentication/verify { ceremonyId, response })
  const verifyRes = await passkeyFetch(
    "/v1/passkeys/authentication/verify",
    {
      method: "POST",
      body: {
        ceremonyId,
        response: assertionResponse,
      },
      skipUserToken: true,
    },
    config
  );

  const verified = verifyRes?.verified ?? verifyRes?.data?.verified ?? (verifyRes?.status === "success");
  const stepUpToken = verifyRes?.stepUpToken || verifyRes?.data?.stepUpToken || verifyRes?.stepUpVerificationToken || verifyRes?.data?.stepUpVerificationToken;
  const credentialId = verifyRes?.credentialId || verifyRes?.data?.credentialId;

  if (!verified) {
    throw new PasskeyError(
      "Server-side passkey assertion verification failed",
      PasskeyErrorCode.VERIFICATION_FAILED,
      verifyRes
    );
  }

  return {
    status: verifyRes?.status || "success",
    success: true,
    verified: true,
    credentialId,
    stepUpToken,
    stepUpVerificationToken: stepUpToken,
    decision: riskDecision || "AUTHENTICATED",
    rawServerResponse: verifyRes,
  };
}`;

indexContent = indexContent.replace(/export async function registerPasskey[\s\S]*?^}/m, newRegisterFunc);
indexContent = indexContent.replace(/export async function authenticatePasskey[\s\S]*?^}/m, newAuthFunc);

fs.writeFileSync(indexPath, indexContent, "utf8");
console.log("Updated registerPasskey and authenticatePasskey in index.js successfully");
