interface Breakdown {
  skillsScore: number;
  salaryScore: number;
  remoteScore: number;
  locationScore: number;
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{score}</span>
    </div>
  );
}

export function FitScoreBreakdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <div className="space-y-1 rounded-md border border-gray-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        Score Breakdown
      </p>
      <ScoreRow label="Skills" score={breakdown.skillsScore} />
      <ScoreRow label="Salary" score={breakdown.salaryScore} />
      <ScoreRow label="Remote" score={breakdown.remoteScore} />
      <ScoreRow label="Location" score={breakdown.locationScore} />
    </div>
  );
}
