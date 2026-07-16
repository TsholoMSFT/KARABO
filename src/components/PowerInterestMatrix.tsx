import type { CustomerStakeholder, StakeholderInfluence, StakeholderInterest } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface PowerInterestMatrixProps {
  stakeholders: CustomerStakeholder[]
}

const QUADRANTS: Array<{
  influence: StakeholderInfluence
  interest: StakeholderInterest
  title: string
  description: string
}> = [
  { influence: 'high', interest: 'high', title: 'Manage closely', description: 'High influence, high interest' },
  { influence: 'high', interest: 'low', title: 'Keep satisfied', description: 'High influence, low interest' },
  { influence: 'low', interest: 'high', title: 'Keep informed', description: 'Low influence, high interest' },
  { influence: 'low', interest: 'low', title: 'Monitor', description: 'Low influence, low interest' },
]

export function PowerInterestMatrix({ stakeholders }: PowerInterestMatrixProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Stakeholder power-interest matrix">
      {QUADRANTS.map((quadrant) => {
        const members = stakeholders.filter(
          (stakeholder) => stakeholder.influence === quadrant.influence && stakeholder.interest === quadrant.interest,
        )
        return (
          <section key={quadrant.title} className="min-h-28 rounded-md border bg-muted/20 p-3" aria-label={quadrant.title}>
            <h4 className="text-sm font-medium">{quadrant.title}</h4>
            <p className="text-[11px] text-muted-foreground">{quadrant.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {members.map((stakeholder) => (
                <Badge key={stakeholder.id} variant="secondary" title={`${stakeholder.name}, ${stakeholder.role}`}>
                  {stakeholder.name}
                </Badge>
              ))}
              {members.length === 0 && <span className="text-xs text-muted-foreground">No stakeholders</span>}
            </div>
          </section>
        )
      })}
    </div>
  )
}