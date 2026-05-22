import { calculateFitScore } from "@/lib/fit-score/calculate";
import { ok, handleApiError } from "@/lib/api-response";
import type { FitInput } from "@/lib/fit-score/calculate";

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.FIT_SCORE_SECRET;
  if (secret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const body = (await req.json()) as FitInput;
    const result = calculateFitScore(body);
    return ok(result);
  } catch (e) {
    return handleApiError(e);
  }
}
