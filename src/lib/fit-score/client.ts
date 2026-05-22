import type { FitInput, FitResult } from "./calculate";

async function doRequest(url: string, secret: string | undefined, input: FitInput): Promise<FitResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Fit-score service error: ${res.status}`);
  return res.json() as Promise<FitResult>;
}

export async function scoreViaService(input: FitInput): Promise<FitResult> {
  const url = process.env.FIT_SCORE_SERVICE_URL;
  if (!url) throw new Error("FIT_SCORE_SERVICE_URL not configured");
  const secret = process.env.FIT_SCORE_SECRET;
  try {
    return await doRequest(url, secret, input);
  } catch {
    return await doRequest(url, secret, input); // retry once; throws on second failure
  }
}
