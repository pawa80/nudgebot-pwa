import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DailyPromptProps {
  onSubmit: (task: string) => Promise<void>;
}

export default function DailyPrompt({ onSubmit }: DailyPromptProps) {
  const [task, setTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.trim() || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(task);
      // Reset form after successful submission
      setTask("");
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Today's Challenge</CardTitle>
        <Badge variant="secondary">{formattedDate}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-600 mb-4 text-base leading-relaxed">
          What's the one high-impact thing you'll do today that excites + challenges you?
        </p>
        
        <form onSubmit={handleSubmit} className="mb-1">
          <div className="relative mb-3">
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              maxLength={60}
              placeholder="Type your high-impact task here..."
              className="w-full px-4 py-3 text-base"
            />
            <div className="absolute right-3 bottom-3 text-xs text-neutral-500">
              {task.length}/60
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-3"
            disabled={!task.trim() || isSubmitting}
          >
            Get My Daily Nudge
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
