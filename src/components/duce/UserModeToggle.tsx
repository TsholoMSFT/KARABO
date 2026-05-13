import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useUserMode } from '@/hooks/use-user-mode'

export function UserModeToggle({ className = '' }: { className?: string }) {
  const { isFacilitator, toggle } = useUserMode()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label htmlFor="duce-mode" className="text-xs uppercase tracking-wide text-muted-foreground">
        Mode
      </Label>
      <div className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1">
        <span className={`text-xs ${!isFacilitator ? 'font-semibold' : 'text-muted-foreground'}`}>Participant</span>
        <Switch id="duce-mode" checked={isFacilitator} onCheckedChange={toggle} />
        <span className={`text-xs ${isFacilitator ? 'font-semibold' : 'text-muted-foreground'}`}>Facilitator</span>
      </div>
    </div>
  )
}
