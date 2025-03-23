import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface DailyPromptProps {
  onSubmit: (task: string) => Promise<void>;
}

export default function DailyPrompt({ onSubmit }: DailyPromptProps) {
  const [task, setTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Handle PWA install prompt
  useEffect(() => {
    // Check if the app is already installed (in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isStandalone) {
      // Check if install prompt is available (set in main.tsx)
      const checkInstallPrompt = () => {
        if ((window as any).deferredPrompt) {
          setShowInstallPrompt(true);
        }
      };
      
      // Check after a delay to ensure the event has fired
      setTimeout(checkInstallPrompt, 3000);
      
      // Also check when the window is focused (user might have dismissed it)
      window.addEventListener('focus', checkInstallPrompt);
      
      return () => {
        window.removeEventListener('focus', checkInstallPrompt);
      };
    }
  }, []);
  
  const handleInstall = () => {
    if (window.showInstallPrompt) {
      window.showInstallPrompt();
      setShowInstallPrompt(false);
    }
  };
  
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
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <>
      <Card className="mb-6 shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-bold">Today's Challenge</CardTitle>
          <Badge variant="secondary" className="text-sm px-3 py-1.5">{formattedDate}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            What's the one high-impact thing you'll do today that excites + challenges you?
          </p>
          
          <form onSubmit={handleSubmit} className="mb-1">
            <div className="relative mb-4">
              <Input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                maxLength={60}
                placeholder="Type your high-impact task here..."
                className="touch-input w-full text-base"
              />
              <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {task.length}/60
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="touch-button w-full text-base font-medium"
              size="lg"
              disabled={!task.trim() || isSubmitting}
            >
              {isSubmitting ? "Thinking..." : "Get My Daily Nudge"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {showInstallPrompt && (
        <div className="install-prompt flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium mb-1">Add to Home Screen</h3>
            <p className="text-sm">Install NudgeBot for the best experience</p>
          </div>
          <Button 
            onClick={handleInstall} 
            size="sm"
            className="ml-2 flex items-center gap-1"
          >
            <Sparkles size={16} />
            Install
          </Button>
        </div>
      )}
    </>
  );
}
