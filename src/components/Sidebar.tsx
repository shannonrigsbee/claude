import type { Page } from '../types'

interface Props {
  page: Page
  onNavigate: (p: Page) => void
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',   icon: '🏠' },
  { id: 'products',  label: 'Products',   icon: '📦' },
  { id: 'customers', label: 'Customers',  icon: '👥' },
  { id: 'marketing', label: 'Marketing',  icon: '📣' },
]

export function Sidebar({ page, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Haven &amp; Hearth</h1>
        <span>Home Goods</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">Jan 2023 – Dec 2025</div>
    </aside>
  )
}
