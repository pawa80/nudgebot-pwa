import { useState } from "react";
import DailyPrompt from "@/components/DailyPrompt";
import AIResponse from "@/components/AIResponse";
import HistorySection from "@/components/HistorySection";
import SettingsPanel from "@/components/SettingsPanel";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useToast } from "@/hooks/use-toast";
import useCheckIn from "@/hooks/useCheckIn";
import { Settings } from "lucide-react";

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  
  const {
    submitTask,
    isSubmitting,
    latestEntry,
    entries,
    refreshEntries,
    settings,
    updateSettings,
    isSettingsLoading,
    summary,
    isSummaryLoading,
    showWeeklySummary,
    setShowWeeklySummary
  } = useCheckIn();

  const handleSubmitTask = async (task: string) => {
    try {
      await submitTask(task);
      toast({
        title: "Success!",
        description: "Your daily challenge has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      await updateSettings(newSettings);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
      setShowSettings(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="mb-6 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-primary flex items-center">
            <span>NudgeBot</span>
            <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">Beta</span>
          </h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6 text-neutral-500" />
          </button>
        </div>
      </header>

      {/* Daily Prompt */}
      <DailyPrompt onSubmit={handleSubmitTask} />

      {/* AI Response (conditional rendering) */}
      {latestEntry && (
        <AIResponse 
          userInput={latestEntry.task} 
          aiResponse={latestEntry.aiResponse} 
        />
      )}

      {/* History Section */}
      <HistorySection 
        entries={entries} 
        summary={summary}
        isSummaryLoading={isSummaryLoading}
        showWeeklySummary={showWeeklySummary}
        setShowWeeklySummary={setShowWeeklySummary}
      />

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings || {
          reminderTime: "09:00",
          pushNotifications: true,
          weeklySummary: true,
          aiTone: "motivational"
        }}
        onSave={handleSaveSettings}
        isLoading={isSettingsLoading}
      />

      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isSubmitting} />
    </div>
  );
}
