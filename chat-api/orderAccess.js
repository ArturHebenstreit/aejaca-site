import { secretMatches } from "./auth.js";

export function bearerToken(header) {
  if (typeof header !== "string") return null;
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match?.[1] || null;
}

export function orderAccessAllowed(authorization, expectedToken) {
  return secretMatches(bearerToken(authorization), expectedToken);
}
