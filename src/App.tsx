import { useState, useMemo } from 'react'
import { useData } from './hooks/useData'
import { Sidebar } from './components/Sidebar'
import { FilterBar } from './components/FilterBar'
import { Overview } from './pages/Overview'
import { Products } from './pages/Products'
import { Customers } from './pages/Customers'
import { Marketing } from './pages/Marketing'
import type { TimeRange, Channel, Page } from './types'

const DATE_RANGES: Record<TimeRange, { start: string; end: string }> = {
  '30d': { start: '2025-12-01', end: '2025-12-31' },
  '90d': { start: '2025-10-02', end: '2025-12-31' },
  ytd:  { start: '2025-01-01', end: '2025-12-31' },
  all:  { start: '2023-01-01', end: '2025-12-31' },
}

export default function App() {
  const { orders, customers, adSpend, loading } = useData()
  const [page, setPage] = useState<Page>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [channel, setChannel] = useState<Channel>('all')

  const dateRange = DATE_RANGES[timeRange]

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const inDate = o.order_date >= dateRange.start && o.order_date <= dateRange.end
        const inCh = channel === 'all' || o.channel === channel
        return inDate && inCh
      }),
    [orders, dateRange, channel]
  )

  const filteredAdSpend = useMemo(() => {
    const s = dateRange.start.slice(0, 7)
    const e = dateRange.end.slice(0, 7)
    return adSpend.filter((a) => a.month >= s && a.month <= e)
  }, [adSpend, dateRange])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} />
      <div className="main-area">
        <FilterBar
          timeRange={timeRange}
          channel={channel}
          onTimeRangeChange={setTimeRange}
          onChannelChange={setChannel}
        />
        <div className="page-content">
          {page === 'overview'   && <Overview orders={filteredOrders} customers={customers} dateRange={dateRange} />}
          {page === 'products'   && <Products orders={filteredOrders} />}
          {page === 'customers'  && <Customers orders={filteredOrders} customers={customers} dateRange={dateRange} />}
          {page === 'marketing'  && <Marketing adSpend={filteredAdSpend} />}
        </div>
      </div>
    </div>
  )
}
