import fs from 'fs';

const indexPath = "D:/Work/Dwield/dwield-sdk/src/passkey/index.js";
let indexContent = fs.readFileSync(indexPath, "utf8");

const oldFuncRegex = /export async function registerPasskey[\s\S]*?^}/m;

const newFunc = `export async function registerPasskey(options = {}, config = {}) {
  const userEmail = typeof options === 'string' ? options : (options.email || options.userName || options.userEmail);

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

  // 1. Request registration options from Passkey Server (sending X-API-Key, without X-Dwield-User-Token)
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

  // 2. Trigger browser WebAuthn registration ceremony
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

  // 3. Submit registration response to server for verification (without X-Dwield-User-Token)
  const verifyRes = await passkeyFetch(
    "/v1/passkeys/registration/verify",
    {
      method: "POST",
      body: {
        email: userEmail,
        ceremonyId,
        response: registrationResponse,
      },
      skipUserToken: true,
    },
    config
  );

  const verified = verifyRes?.verified ?? verifyRes?.data?.verified ?? (verifyRes?.status === "success");
  const credentialId = verifyRes?.credentialId || verifyRes?.data?.credentialId;
  const friendlyName = verifyRes?.friendlyName || verifyRes?.data?.friendlyName;

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
    friendlyName,
    rawServerResponse: verifyRes,
  };
}`;

indexContent = indexContent.replace(oldFuncRegex, newFunc);
fs.writeFileSync(indexPath, indexContent, "utf8");
console.log("Updated registerPasskey in index.js successfully");
