import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { KPICard } from '../components/KPICard'
import { StateMap } from '../components/StateMap'
import type { Order, Customer, DateRange } from '../types'

const TIER_COLORS: Record<string, string> = {
  none: '#F9A8D4', silver: '#C084FC', gold: '#FBBF24', platinum: '#A855F7',
}
const CHANNEL_COLORS = ['#EC4899', '#A855F7', '#F97316', '#22C55E', '#3B82F6', '#EAB308', '#14B8A6']

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #F9A8D4',
  boxShadow: '0 4px 16px rgba(219,39,119,0.1)',
}

interface Props {
  orders: Order[]
  customers: Customer[]
  dateRange: DateRange
}

export function Customers({ orders, customers, dateRange }: Props) {
  // Active customers in period
  const activeIds = useMemo(() => new Set(orders.map((o) => o.customer_id)), [orders])
  const activeCustomers = useMemo(
    () => customers.filter((c) => activeIds.has(c.customer_id)),
    [customers, activeIds]
  )

  const newCustomers = useMemo(
    () => customers.filter((c) => c.signup_date >= dateRange.start && c.signup_date <= dateRange.end),
    [customers, dateRange]
  )

  const avgLTV = useMemo(() => {
    if (!activeCustomers.length) return 0
    return activeCustomers.reduce((s, c) => s + (c.ltv ?? 0), 0) / activeCustomers.length
  }, [activeCustomers])

  // Membership tier breakdown
  const tierData = useMemo(() => {
    const map = new Map<string, number>()
    activeCustomers.forEach((c) => {
      const t = c.membership_tier ?? 'none'
      map.set(t, (map.get(t) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [activeCustomers])

  // Acquisition channel
  const channelData = useMemo(() => {
    const map = new Map<string, number>()
    activeCustomers.forEach((c) => {
      const ch = c.channel_acquired ?? 'unknown'
      map.set(ch, (map.get(ch) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, Customers: value }))
      .sort((a, b) => b.Customers - a.Customers)
  }, [activeCustomers])

  // State distribution for map
  const stateData = useMemo(() => {
    const map = new Map<string, number>()
    customers.forEach((c) => {
      if (c.state) map.set(c.state, (map.get(c.state) ?? 0) + 1)
    })
    return Object.fromEntries(map)
  }, [customers])

  const fmtLTV = (n: number) => `$${n.toFixed(0)}`

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Who's shopping, where they're from, and how they found us</p>
      </div>

      <div className="kpi-grid">
        <KPICard label="Active Customers"   value={activeCustomers.length.toLocaleString()} sub="placed order in period"     color="pink"    />
        <KPICard label="New Customers"      value={newCustomers.length.toLocaleString()}    sub="signed up in period"        color="purple"  />
        <KPICard label="Returning Customers" value={(activeCustomers.length - newCustomers.filter(c => activeIds.has(c.customer_id)).length).toLocaleString()} sub="returning shoppers" color="fuchsia" />
        <KPICard label="Avg Lifetime Value" value={`$${avgLTV.toFixed(0)}`}                sub="per active customer"        color="rose"    />
      </div>

      <div className="chart-grid cols-1-2">
        {/* Membership tier donut */}
        <div className="chart-card">
          <h3>Membership Tiers</h3>
          <p className="chart-sub">Active customers by tier</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={tierData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {tierData.map((entry) => (
                  <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? '#C084FC'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Acquisition channel */}
        <div className="chart-card">
          <h3>Acquisition Channel</h3>
          <p className="chart-sub">How active customers first found us</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Customers" radius={[0, 4, 4, 0]}>
                {channelData.map((_, i) => (
                  <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State map — spans full width */}
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr' }}>
        <StateMap
          data={stateData}
          title="Customer Geography"
          valueLabel="Customers"
          formatValue={(v) => fmtLTV(v).replace('$', '') + ' customers'}
        />
      </div>
    </div>
  )
}
