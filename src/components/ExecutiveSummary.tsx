import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Sparkle, Robot, Image as ImageIcon, ArrowsClockwise } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { generateHeroImage } from '@/lib/image-service'

interface ExecutiveSummaryProps {
  summary: string
  customerName?: string
  industry?: string
  onChange?: (summary: string) => void
}

export function ExecutiveSummary({ summary, customerName, industry }: ExecutiveSummaryProps) {
  const [coverB64, setCoverB64] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  if (!summary) return null

  const handleGenerateCover = async () => {
    setGenerating(true)
    try {
      const img = await generateHeroImage({
        customerName,
        industry,
        theme: summary.slice(0, 240),
      })
      setCoverB64(img.b64)
      toast.success('Cover image ready')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image generation failed'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="mb-6 bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/5 border-accent/30 border-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />

        {coverB64 && (
          <div className="relative w-full aspect-[16/9] overflow-hidden border-b border-accent/30">
            <img
              src={`data:image/png;base64,${coverB64}`}
              alt="AI-generated executive cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardHeader className="relative">
          <div className="flex items-center justify-between gap-3 flex-wrap">
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-accent/20 border-accent/40 text-accent font-semibold">
                <Sparkle size={14} weight="fill" />
                AI Generated
              </Badge>
              <Button
                size="sm"
                variant={coverB64 ? 'outline' : 'default'}
                onClick={handleGenerateCover}
                disabled={generating}
                className="gap-1.5"
              >
                {generating ? (
                  <ArrowsClockwise size={14} className="animate-spin" />
                ) : (
                  <ImageIcon size={14} weight="duotone" />
                )}
                {coverB64 ? 'Regenerate cover' : 'Generate cover image'}
              </Button>
            </div>
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
