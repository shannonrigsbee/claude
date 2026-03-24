import type { TimeRange, Channel } from '../types'

interface Props {
  timeRange: TimeRange
  channel: Channel
  onTimeRangeChange: (t: TimeRange) => void
  onChannelChange: (c: Channel) => void
}

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '30d',  label: 'Dec 2025' },
  { value: '90d',  label: 'Last 90 Days' },
  { value: 'ytd',  label: '2025' },
  { value: 'all',  label: 'All Time' },
]

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: 'all',      label: 'All Channels' },
  { value: 'online',   label: 'Online' },
  { value: 'in-store', label: 'In-Store' },
]

export function FilterBar({ timeRange, channel, onTimeRangeChange, onChannelChange }: Props) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Period</span>
        <div className="pill-group">
          {TIME_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`pill ${timeRange === o.value ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">Channel</span>
        <div className="pill-group">
          {CHANNEL_OPTIONS.map((o) => (
            <button
              key={o.value}
              className={`pill ${channel === o.value ? 'active' : ''}`}
              onClick={() => onChannelChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
