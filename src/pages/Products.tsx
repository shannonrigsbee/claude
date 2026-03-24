import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { Order } from '../types'

const COLORS = ['#EC4899', '#A855F7', '#F97316', '#22C55E', '#3B82F6', '#EAB308', '#14B8A6', '#F43F5E']

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(1)}K`

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #F9A8D4',
  boxShadow: '0 4px 16px rgba(219,39,119,0.1)',
}

interface Props { orders: Order[] }

export function Products({ orders }: Props) {
  const revenueByCategory = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => map.set(o.category, (map.get(o.category) ?? 0) + o.line_total))
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [orders])

  const productTypeSplit = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => {
      const label = o.product_type === 'service' ? 'Services' : 'Products'
      map.set(label, (map.get(label) ?? 0) + o.line_total)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }))
  }, [orders])

  const topProducts = useMemo(() => {
    const map = new Map<string, { revenue: number; units: number }>()
    orders.forEach((o) => {
      const cur = map.get(o.product_name) ?? { revenue: 0, units: 0 }
      map.set(o.product_name, { revenue: cur.revenue + o.line_total, units: cur.units + o.quantity })
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, Revenue: Math.round(v.revenue), units: v.units }))
      .sort((a, b) => b.Revenue - a.Revenue)
      .slice(0, 10)
  }, [orders])

  const discountDist = useMemo(() => {
    const map = new Map<number, number>()
    orders.forEach((o) => map.set(o.discount_pct, (map.get(o.discount_pct) ?? 0) + 1))
    return Array.from(map.entries())
      .map(([pct, count]) => ({ name: `${pct}% off`, count }))
      .sort((a, b) => parseFloat(a.name) - parseFloat(b.name))
  }, [orders])

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <p>Category performance, product mix, and discount analysis</p>
      </div>

      <div className="chart-grid cols-2-1">
        {/* Revenue by category */}
        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <p className="chart-sub">Total line revenue per product category</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByCategory} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmt$} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip formatter={(v: number) => [fmt$(v), 'Revenue']} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Products vs Services */}
        <div className="chart-card">
          <h3>Products vs. Services</h3>
          <p className="chart-sub">Revenue share by type</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={productTypeSplit}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {productTypeSplit.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#EC4899' : '#A855F7'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [fmt$(v), '']} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-grid cols-2">
        {/* Top 10 products */}
        <div className="chart-card">
          <h3>Top 10 Products by Revenue</h3>
          <p className="chart-sub">Ranked by total line revenue</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Revenue</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.name}>
                  <td style={{ color: '#9CA3AF', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </td>
                  <td style={{ fontWeight: 600, color: '#DB2777' }}>{fmt$(p.Revenue)}</td>
                  <td style={{ color: '#6B7280' }}>{p.units.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Discount distribution */}
        <div className="chart-card">
          <h3>Discount Distribution</h3>
          <p className="chart-sub">Number of line items per discount tier</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={discountDist} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Line Items" radius={[4, 4, 0, 0]}>
                {discountDist.map((_, i) => (
                  <Cell key={i} fill={['#FCE7F3', '#F9A8D4', '#F472B6', '#EC4899', '#DB2777'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
