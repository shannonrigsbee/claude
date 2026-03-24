type ColorVariant = 'pink' | 'purple' | 'fuchsia' | 'rose' | 'indigo' | 'teal'

interface Props {
  label: string
  value: string
  sub?: string
  color?: ColorVariant
}

export function KPICard({ label, value, sub, color = 'pink' }: Props) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
