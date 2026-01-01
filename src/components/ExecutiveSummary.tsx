import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Sparkle, Robot } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface ExecutiveSummaryProps {
  summary: string
  onChange?: (summary: string) => void
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  if (!summary) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="mb-6 bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/5 border-accent/30 border-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <FileText size={24} weight="duotone" className="text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Executive Summary
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkle size={18} weight="fill" className="text-primary" />
                  </motion.div>
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <Robot size={14} weight="fill" className="text-accent" />
                  Powered by AI - Generated from discovery session insights
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 bg-accent/20 border-accent/40 text-accent font-semibold">
              <Sparkle size={14} weight="fill" />
              AI Generated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="prose prose-sm max-w-none">
            {summary.split('\n\n').map((paragraph, idx) => (
              paragraph.trim() && (
                <motion.p 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="mb-4 leading-relaxed text-foreground"
                >
                  {paragraph}
                </motion.p>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
