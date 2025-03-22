import { Loader } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
}

export default function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-20">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-500">Generating your nudge...</p>
      </div>
    </div>
  );
}
