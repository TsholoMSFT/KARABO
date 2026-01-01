import * as React from 'react'
import { Input } from './input'
import { Label } from './label'
import { cn } from '@/lib/utils'

export type Currency = 'GBP' | 'USD' | 'EUR'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
  currency?: Currency
  label?: string
  error?: string
  showSymbol?: boolean
}

const currencySymbols: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
}

export function CurrencyInput({
  value,
  onChange,
  currency = 'GBP',
  label,
  error,
  showSymbol = true,
  className,
  disabled,
  placeholder = '0',
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)

  // Format number with commas for display
  const formatNumber = (num: number): string => {
    if (num === 0) return ''
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Parse formatted string to number
  const parseNumber = (str: string): number => {
    const cleaned = str.replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Update display value when prop value changes and not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value))
    }
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setDisplayValue(input)
    
    // Allow only numbers, decimals, and commas
    const cleaned = input.replace(/[^0-9.]/g, '')
    const numValue = parseNumber(cleaned)
    onChange(numValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
    // Remove formatting on focus for easier editing
    setDisplayValue(value === 0 ? '' : value.toString())
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Reformat on blur
    const numValue = parseNumber(displayValue)
    onChange(numValue)
    setDisplayValue(formatNumber(numValue))
  }

  const symbol = currencySymbols[currency]

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className={cn(error && 'text-destructive')}>
          {label}
        </Label>
      )}
      <div className="relative">
        {showSymbol && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {symbol}
          </div>
        )}
        <Input
          {...props}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            showSymbol && 'pl-8',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

// Compact version for tables/inline use
export function CurrencyInputCompact({
  value,
  onChange,
  currency = 'GBP',
  className,
  disabled,
  ...props
}: Omit<CurrencyInputProps, 'label' | 'error' | 'showSymbol'>) {
  return (
    <CurrencyInput
      value={value}
      onChange={onChange}
      currency={currency}
      showSymbol={true}
      className={cn('h-9 text-sm', className)}
      disabled={disabled}
      {...props}
    />
  )
}

// Display-only formatted currency
export function CurrencyDisplay({
  value,
  currency = 'GBP',
  className,
}: {
  value: number
  currency?: Currency
  className?: string
}) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

  return <span className={cn('font-medium', className)}>{formatted}</span>
}
