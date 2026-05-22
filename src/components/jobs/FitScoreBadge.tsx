import { Badge, scoreVariant } from "@/components/ui/Badge";

export function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <Badge variant="default">–</Badge>;
  }
  return <Badge variant={scoreVariant(score)}>{score}</Badge>;
}
