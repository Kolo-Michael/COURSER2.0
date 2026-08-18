/**
 * Verifalia email-verification integration.
 *
 * Before sending password-reset codes we ask Verifalia whether the target
 * address is actually deliverable, so reset emails aren't wasted on dead or
 * typo'd mailboxes. The service is intentionally fail-soft:
 *   - when no credentials are configured (VERIFALIA_SID / VERIFALIA_TOKEN
 *     missing) it returns null and the caller proceeds as usual;
 *   - when the API errors it returns null too, so a verification outage never
 *     blocks a legitimate password reset.
 *
 * API: POST https://api.verifalia.com/v2.7/email-validations with HTTP Basic
 * auth (username = sub-account SID, password = auth token). `waitTime` makes
 * the call synchronous (up to 30s) so we don't have to poll a job id.
 */
const VERIFALIA_BASE_URL = "https://api.verifalia.com/v2.7";

export interface VerifaliaResult {
  /** Verifalia classification: Deliverable | Undeliverable | Risky | Unknown. */
  classification: string;
  /** Fine-grained status code, e.g. Success | DomainDoesNotExist. */
  status: string;
}

function isConfigured(): boolean {
  return Boolean(process.env.VERIFALIA_SID && process.env.VERIFALIA_TOKEN);
}

/**
 * Ask Verifalia whether an email address is deliverable.
 *
 * Returns:
 *   - `{ classification, status }` when the verification completed,
 *   - `null` when unconfigured, the API failed, or the job didn't finish
 *     within the wait window (caller treats null as "unknown, proceed").
 */
export async function verifyEmailDeliverability(
  email: string
): Promise<VerifaliaResult | null> {
  if (!isConfigured()) return null;

  const basic = Buffer.from(
    `${process.env.VERIFALIA_SID}:${process.env.VERIFALIA_TOKEN}`
  ).toString("base64");

  try {
    const res = await fetch(
      `${VERIFALIA_BASE_URL}/email-validations?waitTime=30000`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entries: [{ inputData: email }],
        }),
      }
    );

    if (res.status === 401 || res.status === 403) {
      console.warn("Verifalia auth failed:", res.status);
      return null;
    }
    if (!res.ok) {
      console.warn("Verifalia request failed:", res.status, await res.text());
      return null;
    }

    const payload = (await res.json()) as {
      status?: string;
      entries?: Array<{ classification?: string; status?: string }>;
    };
    if (payload.status !== "Completed") return null; // still InProgress after wait

    const entry = payload.entries?.[0];
    if (!entry) return null;
    return {
      classification: entry.classification || "Unknown",
      status: entry.status || "Unknown",
    };
  } catch (err) {
    console.warn("Verifalia call failed:", err);
    return null;
  }
}
