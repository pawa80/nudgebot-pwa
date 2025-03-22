import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { Entry, Summary } from "@shared/schema";
import WeeklySummary from "./WeeklySummary";

interface HistorySectionProps {
  entries: Entry[];
  summary: Summary | null;
  isSummaryLoading: boolean;
  showWeeklySummary: boolean;
  setShowWeeklySummary: (show: boolean) => void;
}

export default function HistorySection({ 
  entries, 
  summary, 
  isSummaryLoading,
  showWeeklySummary,
  setShowWeeklySummary
}: HistorySectionProps) {
  
  const toggleWeeklySummary = () => {
    setShowWeeklySummary(!showWeeklySummary);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="flex-grow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-lg">Your History</h2>
        <Button 
          variant="ghost" 
          onClick={toggleWeeklySummary}
          className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center p-0"
        >
          <span>Weekly Summary</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      {/* Weekly Summary (conditionally rendered) */}
      {showWeeklySummary && (
        <WeeklySummary summary={summary} isLoading={isSummaryLoading} />
      )}

      {/* History Items */}
      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Card key={entry.id} className="shadow-sm">
              <CardContent className="p-3 flex items-start">
                <div className="min-w-[40px] flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full ${entry.completed ? 'bg-green-100' : 'bg-orange-100'} flex items-center justify-center`}>
                    {entry.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">{entry.task}</p>
                    <span className="text-xs text-neutral-500">{formatDate(entry.date)}</span>
                  </div>
                  <p className="text-xs text-neutral-500 italic">
                    {entry.aiResponse}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-neutral-500 mb-2">No entries yet</p>
            <p className="text-sm">Your daily challenges will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
