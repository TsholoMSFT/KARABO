/**
 * Mermaid theme variables tuned to match shadcn light/dark palettes.
 */

export type DiagramTheme = 'light' | 'dark'

export function mermaidThemeVariables(theme: DiagramTheme) {
  if (theme === 'dark') {
    return {
      background: '#0B1020',
      primaryColor: '#1E293B',
      primaryTextColor: '#E2E8F0',
      primaryBorderColor: '#334155',
      lineColor: '#64748B',
      tertiaryColor: '#0F172A',
      clusterBkg: '#111827',
      clusterBorder: '#334155',
      edgeLabelBackground: '#0B1020',
    }
  }
  return {
    background: '#FFFFFF',
    primaryColor: '#F1F5F9',
    primaryTextColor: '#0F172A',
    primaryBorderColor: '#CBD5E1',
    lineColor: '#64748B',
    tertiaryColor: '#F8FAFC',
    clusterBkg: '#F8FAFC',
    clusterBorder: '#CBD5E1',
    edgeLabelBackground: '#FFFFFF',
  }
}

export const STATE_COLORS = {
  reused: { fill: '#DCFCE7', stroke: '#16A34A', text: '#14532D' },   // green
  netNew: { fill: '#DBEAFE', stroke: '#2563EB', text: '#1E3A8A' },   // blue
  gap:    { fill: '#FEE2E2', stroke: '#DC2626', text: '#7F1D1D' },   // red
}
