import { Plus, FileArrowUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  onAddFirst: () => void
  onImport?: () => void
}

export function EmptyState({ onAddFirst, onImport }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Plus size={48} className="text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">No Use Cases Yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start prioritizing by adding your first use case, or import from an existing document.
        Evaluate using Impact vs. Feasibility or RICE scoring to identify top opportunities.
      </p>
      <div className="flex gap-3">
        {onImport && (
          <Button onClick={onImport} variant="outline" size="lg" className="gap-2">
            <FileArrowUp size={20} weight="bold" />
            Import from Document
          </Button>
        )}
        <Button onClick={onAddFirst} size="lg" className="gap-2">
          <Plus size={20} weight="bold" />
          Add Your First Use Case
        </Button>
      </div>
    </motion.div>
  )
}
