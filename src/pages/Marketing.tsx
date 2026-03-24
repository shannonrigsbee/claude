import { useMemo } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { KPICard } from '../components/KPICard'
import type { AdSpend } from '../types'

const CHANNEL_COLORS: Record<string, string> = {
  'Google Ads':    '#EC4899',
  'Meta Ads':      '#A855F7',
  'TikTok Ads':    '#F97316',
  'Email Marketing': '#22C55E',
  'Direct Mail':   '#3B82F6',
}

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(1)}K`

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-')
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1]} ${y.slice(2)}`
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #F9A8D4',
  boxShadow: '0 4px 16px rgba(219,39,119,0.1)',
}

interface Props { adSpend: AdSpend[] }

export function Marketing({ adSpend }: Props) {
  // Per-channel totals
  const channelTotals = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number; conversions: number }>()
    adSpend.forEach((a) => {
      const cur = map.get(a.channel) ?? { spend: 0, revenue: 0, conversions: 0 }
      map.set(a.channel, {
        spend: cur.spend + a.spend,
        revenue: cur.revenue + a.revenue_attributed,
        conversions: cur.conversions + a.conversions,
      })
    })
    return Array.from(map.entries()).map(([channel, v]) => ({
      channel,
      Spend: Math.round(v.spend),
      Revenue: Math.round(v.revenue),
      ROAS: v.spend > 0 ? +(v.revenue / v.spend).toFixed(2) : 0,
      Conversions: v.conversions,
    }))
  }, [adSpend])

  const roasData = useMemo(
    () => [...channelTotals].sort((a, b) => b.ROAS - a.ROAS),
    [channelTotals]
  )

  const totalSpend    = useMemo(() => channelTotals.reduce((s, c) => s + c.Spend, 0), [channelTotals])
  const totalRevenue  = useMemo(() => channelTotals.reduce((s, c) => s + c.Revenue, 0), [channelTotals])
  const overallROAS   = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0'
  const bestChannel   = roasData[0]?.channel ?? '—'

  // Monthly spend trend, stacked by channel
  const monthlyByChannel = useMemo(() => {
    const months = [...new Set(adSpend.map((a) => a.month))].sort()
    const channels = [...new Set(adSpend.map((a) => a.channel))]
    return months.map((month) => {
      const row: Record<string, string | number> = { month: fmtMonth(month) }
      channels.forEach((ch) => {
        const entry = adSpend.find((a) => a.month === month && a.channel === ch)
        row[ch] = entry ? Math.round(entry.spend) : 0
      })
      return row
    })
  }, [adSpend])

  const channels = useMemo(() => [...new Set(adSpend.map((a) => a.channel))], [adSpend])

  // Revenue attributed over time by channel
  const revenueByMonth = useMemo(() => {
    const months = [...new Set(adSpend.map((a) => a.month))].sort()
    return months.map((month) => {
      const row: Record<string, string | number> = { month: fmtMonth(month) }
      channels.forEach((ch) => {
        const entry = adSpend.find((a) => a.month === month && a.channel === ch)
        row[ch] = entry ? Math.round(entry.revenue_attributed) : 0
      })
      return row
    })
  }, [adSpend, channels])

  return (
    <div>
      <div className="page-header">
        <h2>Marketing</h2>
        <p>Ad spend, ROAS, and channel performance</p>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Ad Spend"      value={fmt$(totalSpend)}           sub="across all channels"        color="pink"   />
        <KPICard label="Attributed Revenue"  value={fmt$(totalRevenue)}         sub="revenue attributed to ads"  color="purple" />
        <KPICard label="Overall ROAS"        value={`${overallROAS}×`}          sub="return on ad spend"         color="fuchsia"/>
        <KPICard label="Best ROAS Channel"   value={bestChannel}                sub={`${roasData[0]?.ROAS ?? 0}× return`} color="rose" />
      </div>

      <div className="chart-grid cols-2">
        {/* ROAS by channel */}
        <div className="chart-card">
          <h3>ROAS by Channel</h3>
          <p className="chart-sub">Revenue per $1 spent, by channel</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roasData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                formatter={(v: number) => [`${v}×`, 'ROAS']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="ROAS" radius={[4, 4, 0, 0]}>
                {roasData.map((entry) => (
                  <Bar key={entry.channel} dataKey="ROAS" fill={CHANNEL_COLORS[entry.channel] ?? '#EC4899'} />
                ))}
                {roasData.map((entry, i) => {
                  const fills = Object.values(CHANNEL_COLORS)
                  return <Cell key={i} fill={CHANNEL_COLORS[entry.channel] ?? fills[i % fills.length]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spend vs Revenue */}
        <div className="chart-card">
          <h3>Spend vs. Attributed Revenue</h3>
          <p className="chart-sub">Total across all channels per channel</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelTotals} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={fmt$} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={56} />
              <Tooltip formatter={(v: number) => [fmt$(v), '']} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Spend"   fill="#F9A8D4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Revenue" fill="#A855F7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly spend trend */}
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <h3>Monthly Ad Spend by Channel</h3>
          <p className="chart-sub">Stacked spend over the selected period</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyByChannel}>
              <defs>
                {channels.map((ch) => (
                  <linearGradient key={ch} id={`grad-${ch.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHANNEL_COLORS[ch] ?? '#EC4899'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHANNEL_COLORS[ch] ?? '#EC4899'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={fmt$} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={56} />
              <Tooltip formatter={(v: number) => [fmt$(v), '']} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {channels.map((ch) => (
                <Area
                  key={ch}
                  type="monotone"
                  dataKey={ch}
                  stackId="1"
                  stroke={CHANNEL_COLORS[ch] ?? '#EC4899'}
                  fill={`url(#grad-${ch.replace(/\s/g, '')})`}
                  strokeWidth={1.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue attributed trend */}
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <h3>Attributed Revenue by Channel</h3>
          <p className="chart-sub">Monthly revenue attributed per channel</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueByMonth}>
              <defs>
                {channels.map((ch) => (
                  <linearGradient key={ch} id={`rev-${ch.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHANNEL_COLORS[ch] ?? '#EC4899'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHANNEL_COLORS[ch] ?? '#EC4899'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={fmt$} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={56} />
              <Tooltip formatter={(v: number) => [fmt$(v), '']} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {channels.map((ch) => (
                <Area
                  key={ch}
                  type="monotone"
                  dataKey={ch}
                  stroke={CHANNEL_COLORS[ch] ?? '#EC4899'}
                  fill={`url(#rev-${ch.replace(/\s/g, '')})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
