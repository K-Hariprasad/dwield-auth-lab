import fs from 'fs';

const apiPath = "D:/Work/Dwield/dwield-sdk/src/passkey/api.js";
let apiContent = fs.readFileSync(apiPath, "utf8");

apiContent = apiContent.replace(
  "export function buildHeaders(config = {}, overrideUserToken = null) {",
  "export function buildHeaders(config = {}, overrideUserToken = null, skipUserToken = false) {"
);

apiContent = apiContent.replace(
  "if (userToken) {",
  "if (userToken && !skipUserToken) {"
);

apiContent = apiContent.replace(
  "...buildHeaders(config, options.userToken),",
  "...buildHeaders(config, options.userToken, options.skipUserToken),"
);

fs.writeFileSync(apiPath, apiContent, "utf8");
console.log("Updated api.js successfully");
