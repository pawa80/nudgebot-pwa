import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface AIResponseProps {
  userInput: string;
  aiResponse: string;
}

export default function AIResponse({ userInput, aiResponse }: AIResponseProps) {
  return (
    <Card className="mb-6 border-l-4 border-secondary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Zap className="h-5 w-5 mr-2 text-secondary" />
          AI Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* User Input Reflection */}
        <div>
          <h3 className="text-xs uppercase text-neutral-500 tracking-wide mb-1">Your task</h3>
          <p className="font-medium text-neutral-800">{userInput}</p>
        </div>
        
        {/* AI Challenge Response */}
        <div>
          <h3 className="text-xs uppercase text-neutral-500 tracking-wide mb-1">AI Nudge</h3>
          <p className="text-neutral-800 leading-relaxed">{aiResponse}</p>
        </div>
      </CardContent>
    </Card>
  );
}
