import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { House, ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { BackendStatusBadge } from './BackendStatusBadge'

interface NavigationHeaderProps {
  onBackToLanding?: () => void
  onBack?: () => void
  backLabel?: string
  title?: string
  subtitle?: string
  showLogo?: boolean
  variant?: 'full' | 'minimal'
  className?: string
  iconColorClass?: string
}

export function NavigationHeader({
  onBackToLanding,
  onBack,
  backLabel = 'Back',
  title,
  subtitle,
  showLogo = true,
  variant = 'full',
  className = '',
  iconColorClass = 'text-primary'
}: NavigationHeaderProps) {
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between py-4 ${className}`}
      >
        <div className="flex items-center gap-4">
          {onBackToLanding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLanding}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <House size={18} weight="duotone" />
              Home
            </Button>
          )}
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft size={18} weight="bold" />
              {backLabel}
            </Button>
          )}
        </div>
        {title && (
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        )}
        <div className="w-20" /> {/* Spacer for centering */}
      </motion.div>
    )
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 ${className}`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4">
            {onBackToLanding && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLanding}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <House size={18} weight="duotone" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            )}
            {onBack && (
              <>
                {onBackToLanding && (
                  <Separator orientation="vertical" className="h-6" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="gap-2"
                >
                  <ArrowLeft size={18} weight="bold" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Button>
              </>
            )}
          </div>

          {/* Center: Logo/Title */}
          {showLogo && (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColorClass.replace('text-', 'bg-')}/10`}>
                <Sparkle size={20} weight="duotone" className={iconColorClass} />
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-semibold text-foreground">
                  {title || 'Microsoft Innovation Hub: ID-8'}
                </h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Right: Live backend status */}
          <div className="w-24 flex items-center justify-end">
            <BackendStatusBadge />
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default NavigationHeader
