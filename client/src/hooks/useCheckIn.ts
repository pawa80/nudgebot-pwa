import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Entry, type Summary, type Setting } from "@shared/schema";

export default function useCheckIn() {
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  
  // Query to fetch entries
  const { 
    data: entriesData,
    isLoading: isEntriesLoading,
    refetch: refreshEntries
  } = useQuery({
    queryKey: ["/api/entries"],
  });
  
  // Query to fetch settings
  const {
    data: settingsData,
    isLoading: isSettingsLoading
  } = useQuery({
    queryKey: ["/api/settings"],
  });
  
  // Query to fetch weekly summary
  const {
    data: summaryData,
    isLoading: isSummaryLoading
  } = useQuery({
    queryKey: ["/api/summary"],
    enabled: showWeeklySummary, // Only fetch when summary is shown
  });
  
  // Mutation to submit a task
  const {
    mutateAsync: submitTaskMutation,
    isPending: isSubmitting
  } = useMutation({
    mutationFn: async (task: string) => {
      const res = await apiRequest("POST", "/api/check-in", { task });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
    },
  });
  
  // Mutation to update settings
  const {
    mutateAsync: updateSettingsMutation
  } = useMutation({
    mutationFn: async (settings: Partial<Setting>) => {
      const res = await apiRequest("PATCH", "/api/settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
  
  // Mutation to mark an entry as completed
  const {
    mutateAsync: markCompletedMutation
  } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/entries/${id}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
    },
  });
  
  // Submit a new task
  const submitTask = async (task: string) => {
    await submitTaskMutation(task);
  };
  
  // Update settings
  const updateSettings = async (settings: Partial<Setting>) => {
    await updateSettingsMutation(settings);
  };
  
  // Mark an entry as completed
  const markEntryCompleted = async (id: number) => {
    await markCompletedMutation(id);
  };
  
  // Derived data
  const entries: Entry[] = entriesData?.entries || [];
  const latestEntry = entries.length > 0 ? entries[0] : null;
  const settings: Setting | null = settingsData?.settings || null;
  const summary: Summary | null = summaryData?.summary || null;
  
  return {
    // Data
    entries,
    latestEntry,
    settings,
    summary,
    
    // Loading states
    isEntriesLoading,
    isSettingsLoading,
    isSummaryLoading,
    isSubmitting,
    
    // Actions
    submitTask,
    updateSettings,
    markEntryCompleted,
    refreshEntries,
    
    // UI state
    showWeeklySummary,
    setShowWeeklySummary,
  };
}
