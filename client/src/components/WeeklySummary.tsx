import { Skeleton } from "@/components/ui/skeleton";
import { Summary } from "@shared/schema";

interface WeeklySummaryProps {
  summary: Summary | null;
  isLoading: boolean;
}

export default function WeeklySummary({ summary, isLoading }: WeeklySummaryProps) {
  if (isLoading) {
    return (
      <div className="bg-primary/5 rounded-xl p-4 mb-4">
        <h3 className="font-medium text-primary mb-2">This Week's Insights</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">Achievements</h4>
            <Skeleton className="w-full h-4 mt-1" />
          </div>
          <div>
            <h4 className="font-medium">Patterns</h4>
            <Skeleton className="w-full h-4 mt-1" />
          </div>
          <div>
            <h4 className="font-medium">Themes</h4>
            <Skeleton className="w-full h-4 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-primary/5 rounded-xl p-4 mb-4">
        <h3 className="font-medium text-primary mb-2">This Week's Insights</h3>
        <p className="text-sm text-neutral-500">No insights available yet. Complete more daily challenges to generate a weekly summary.</p>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 rounded-xl p-4 mb-4">
      <h3 className="font-medium text-primary mb-2">This Week's Insights</h3>
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-medium">Achievements</h4>
          <p className="text-neutral-500">{summary.achievements}</p>
        </div>
        <div>
          <h4 className="font-medium">Patterns</h4>
          <p className="text-neutral-500">{summary.patterns}</p>
        </div>
        <div>
          <h4 className="font-medium">Themes</h4>
          <p className="text-neutral-500">{summary.themes}</p>
        </div>
      </div>
    </div>
  );
}
