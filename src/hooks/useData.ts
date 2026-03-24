import Papa from 'papaparse'
import { useState, useEffect } from 'react'
import type { Order, Customer, AdSpend } from '../types'

function loadCSV<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    })
  })
}

export function useData() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [adSpend, setAdSpend] = useState<AdSpend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadCSV<Order>('/data/orders.csv'),
      loadCSV<Customer>('/data/customers.csv'),
      loadCSV<AdSpend>('/data/ad_spend.csv'),
    ])
      .then(([o, c, a]) => {
        setOrders(o.filter((r) => r.order_id))
        setCustomers(c.filter((r) => r.customer_id))
        setAdSpend(a.filter((r) => r.month))
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  return { orders, customers, adSpend, loading }
}
