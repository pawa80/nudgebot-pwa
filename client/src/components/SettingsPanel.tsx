import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Setting } from "@shared/schema";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Setting;
  onSave: (settings: Partial<Setting>) => Promise<void>;
  isLoading: boolean;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSave,
  isLoading
}: SettingsPanelProps) {
  const [formValues, setFormValues] = useState(settings);
  
  useEffect(() => {
    if (settings) {
      setFormValues(settings);
    }
  }, [settings]);
  
  const handleSave = async () => {
    await onSave(formValues);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="reminderTime" className="text-sm font-medium mb-2 block">Reminder Time</Label>
            <Select
              value={formValues.reminderTime}
              onValueChange={(value) => setFormValues({ ...formValues, reminderTime: value })}
            >
              <SelectTrigger id="reminderTime">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">8:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="11:00">11:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications" className="text-sm font-medium">Push Notifications</Label>
              <p className="text-xs text-neutral-500">Receive daily reminders</p>
            </div>
            <Switch
              id="push-notifications"
              checked={formValues.pushNotifications}
              onCheckedChange={(checked) => setFormValues({ ...formValues, pushNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-summary" className="text-sm font-medium">Weekly Summary</Label>
              <p className="text-xs text-neutral-500">Receive weekly insights report</p>
            </div>
            <Switch
              id="weekly-summary"
              checked={formValues.weeklySummary}
              onCheckedChange={(checked) => setFormValues({ ...formValues, weeklySummary: checked })}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">AI Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={formValues.aiTone === "motivational" ? "secondary" : "outline"}
                onClick={() => setFormValues({ ...formValues, aiTone: "motivational" })}
                className="text-sm"
              >
                Motivational
              </Button>
              <Button 
                variant={formValues.aiTone === "reflective" ? "secondary" : "outline"}
                onClick={() => setFormValues({ ...formValues, aiTone: "reflective" })}
                className="text-sm"
              >
                Reflective
              </Button>
              <Button 
                variant={formValues.aiTone === "challenging" ? "secondary" : "outline"}
                onClick={() => setFormValues({ ...formValues, aiTone: "challenging" })}
                className="text-sm"
              >
                Challenging
              </Button>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="text-red-600 text-sm font-medium"
              disabled={isLoading}
            >
              Clear All History
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
