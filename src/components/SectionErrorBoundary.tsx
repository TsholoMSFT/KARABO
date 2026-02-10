import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  /** Label shown in the error card so the user knows which section failed */
  section?: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Lightweight error boundary for individual sections / panels.
 * Unlike the global ErrorFallback, this renders inline and lets the rest
 * of the page continue working.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary${this.props.section ? ` – ${this.props.section}` : ''}]`, error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>{this.props.section ? `${this.props.section} failed to render` : 'Something went wrong'}</AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            {this.state.error?.message || 'An unexpected error occurred in this section.'}
          </AlertDescription>
          <Button size="sm" variant="outline" className="mt-3" onClick={this.handleRetry}>
            Retry
          </Button>
        </Alert>
      )
    }

    return this.props.children
  }
}
