/**
 * Google OAuth (authorization-code flow) — "Sign in with Google".
 *
 * The SPA links to GET /api/auth/google; that route builds the Google
 * authorize URL (a state cookie guards login CSRF) and the callback below
 * exchanges the returned `code` for tokens. The id_token arrives straight
 * from Google's token endpoint over TLS authenticated by our client_secret,
 * so we validate its claims (aud/iss/exp/email_verified) locally instead of
 * fetching + verifying Google's JWKS — the standard for confidential clients.
 */

import { config } from "../config.js";

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  picture: string | null;
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/** True when the three Google OAuth env vars are all set. */
export function isGoogleConfigured(): boolean {
  return Boolean(
    config.GOOGLE_CLIENT_ID &&
      config.GOOGLE_CLIENT_SECRET &&
      config.GOOGLE_REDIRECT_URI
  );
}

/** Build the Google authorization URL for the server-side redirect flow. */
export function googleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: config.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Decode + JSON.parse the id_token's middle (payload) segment. */
function decodeIdTokenPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Validate an id_token payload against the claims that matter for our app.
 * Returns a normalized profile, or null when any check fails.
 */
function validateIdToken(payload: Record<string, unknown> | null): GoogleProfile | null {
  if (!payload) return null;
  if (payload.aud !== config.GOOGLE_CLIENT_ID) return null;
  const iss = payload.iss;
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") return null;
  const exp = typeof payload.exp === "number" ? payload.exp : Number(payload.exp);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!email) return null;

  return {
    sub: typeof payload.sub === "string" ? payload.sub : "",
    email,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    name: typeof payload.name === "string" ? payload.name : null,
    givenName: typeof payload.given_name === "string" ? payload.given_name : null,
    familyName: typeof payload.family_name === "string" ? payload.family_name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}

/**
 * Exchange an authorization `code` for tokens and return the validated
 * Google profile. Throws on any transport/validation failure.
 */
export async function exchangeGoogleCode(
  code: string
): Promise<{ profile: GoogleProfile; accessToken: string }> {
  const body = new URLSearchParams({
    code,
    client_id: config.GOOGLE_CLIENT_ID,
    client_secret: config.GOOGLE_CLIENT_SECRET,
    redirect_uri: config.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { id_token?: string; access_token?: string };
  if (!data.id_token) throw new Error("Google token exchange returned no id_token");

  const profile = validateIdToken(decodeIdTokenPayload(data.id_token));
  if (!profile) throw new Error("Google id_token failed validation");
  return { profile, accessToken: data.access_token ?? "" };
}