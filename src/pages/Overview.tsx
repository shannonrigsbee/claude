import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import { KPICard } from '../components/KPICard'
import type { Order, Customer, DateRange } from '../types'

const fmt$ = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-')
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1]} ${y.slice(2)}`
}

interface Props {
  orders: Order[]
  customers: Customer[]
  dateRange: DateRange
}

export function Overview({ orders, customers, dateRange }: Props) {
  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + o.line_total, 0),
    [orders]
  )

  const uniqueOrders = useMemo(
    () => new Set(orders.map((o) => o.order_id)).size,
    [orders]
  )

  const aov = uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0

  const repeatRate = useMemo(() => {
    const map = new Map<string, Set<string>>()
    orders.forEach((o) => {
      if (!map.has(o.customer_id)) map.set(o.customer_id, new Set())
      map.get(o.customer_id)!.add(o.order_id)
    })
    const total = map.size
    const repeaters = Array.from(map.values()).filter((s) => s.size > 1).length
    return total > 0 ? (repeaters / total) * 100 : 0
  }, [orders])

  const newCustomers = useMemo(
    () =>
      customers.filter(
        (c) => c.signup_date >= dateRange.start && c.signup_date <= dateRange.end
      ).length,
    [customers, dateRange]
  )

  const monthlyMembershipRevenue = useMemo(
    () => customers.reduce((s, c) => s + (c.membership_fee ?? 0), 0),
    [customers]
  )

  // Monthly revenue trend
  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>()
    orders.forEach((o) => {
      const m = o.order_date.slice(0, 7)
      const cur = map.get(m) ?? { revenue: 0, orders: 0 }
      map.set(m, { revenue: cur.revenue + o.line_total, orders: cur.orders + 1 })
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month: fmtMonth(month),
        Revenue: Math.round(v.revenue),
        Orders: v.orders,
      }))
  }, [orders])

  // Channel split by month
  const channelByMonth = useMemo(() => {
    const map = new Map<string, { online: number; instore: number }>()
    orders.forEach((o) => {
      const m = o.order_date.slice(0, 7)
      const cur = map.get(m) ?? { online: 0, instore: 0 }
      if (o.channel === 'online') cur.online += o.line_total
      else cur.instore += o.line_total
      map.set(m, cur)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month: fmtMonth(month),
        Online: Math.round(v.online),
        'In-Store': Math.round(v.instore),
      }))
  }, [orders])

  const tooltipStyle = {
    contentStyle: {
      borderRadius: 10,
      border: '1px solid #F9A8D4',
      boxShadow: '0 4px 16px rgba(219,39,119,0.1)',
    },
  }

  return (
    <div>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Daily snapshot of Haven &amp; Hearth performance</p>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Revenue"      value={fmt$(totalRevenue)}         sub={`${uniqueOrders.toLocaleString()} orders`} color="pink" />
        <KPICard label="Avg Order Value"    value={`$${aov.toFixed(2)}`}        sub="per order"                                 color="purple" />
        <KPICard label="Repeat Rate"        value={`${repeatRate.toFixed(1)}%`} sub="customers w/ 2+ orders"                    color="fuchsia" />
        <KPICard label="New Customers"      value={newCustomers.toLocaleString()} sub="signed up in period"                      color="rose" />
        <KPICard label="Monthly Membership" value={fmt$(monthlyMembershipRevenue)} sub="recurring revenue"                      color="indigo" />
      </div>

      {/* Revenue trend */}
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <p className="chart-sub">Monthly revenue over the selected period</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue} {...tooltipStyle}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EC4899" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={(v) => fmt$(v)} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={60} />
              <Tooltip formatter={(v: number) => [fmt$(v), 'Revenue']} contentStyle={tooltipStyle.contentStyle} />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#EC4899"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#EC4899' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel split */}
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <h3>Revenue by Channel</h3>
          <p className="chart-sub">Online vs. in-store monthly revenue</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelByMonth} barSize={channelByMonth.length < 6 ? 40 : 14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={(v) => fmt$(v)} tick={{ fontSize: 11, fill: '#9CA3AF' }} width={60} />
              <Tooltip formatter={(v: number) => fmt$(v)} contentStyle={tooltipStyle.contentStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Online"   fill="#EC4899" radius={[3, 3, 0, 0]} />
              <Bar dataKey="In-Store" fill="#A855F7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
