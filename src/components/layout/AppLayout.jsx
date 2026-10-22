import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useChurch } from '../../context/churchStore'
import { exportMembersToCSV, exportSummaryToCSV } from '../../utils/csvUtils'

/** Page titles keyed by route so the top bar always matches the view. */
const PAGE_META = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Live snapshot of giving, pledges and members at Grace Chapel',
  },
  '/members': {
    title: 'Members',
    subtitle: 'Register new members and track what each person has paid',
  },
  '/contributions': {
    title: 'Contributions',
    subtitle: 'Offerings, tithes, donations, fundraising and installment pledges',
  },
}

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()
  const { members, contributions, dashboard, resetDemoData } = useChurch()

  const meta = useMemo(() => {
    if (pathname.startsWith('/members/')) {
      return { title: 'Member Profile', subtitle: 'Full giving history and pledge progress' }
    }
    return PAGE_META[pathname] ?? PAGE_META['/']
  }, [pathname])

  /**
   * Global export. On the members route we hand over the roster report,
   * everywhere else the accounting summary - which is what an admin
   * typically wants from the dashboard.
   */
  function handleExport() {
    if (pathname.startsWith('/members')) {
      exportMembersToCSV(members, contributions)
      return
    }
    exportSummaryToCSV(dashboard.summary, dashboard.campaigns)
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Offset for the fixed sidebar on large screens */}
      <div className="lg:pl-72">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setNavOpen(true)}
          onExport={handleExport}
          onReset={() => {
            if (window.confirm('Reset all records back to the original demo data?')) {
              resetDemoData()
            }
          }}
        />

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>

        <footer className="px-4 pb-8 text-center text-xs text-ink-400 sm:px-6">
          Grace Chapel Admin Console &middot; frontend demo &middot; data saved in this browser
        </footer>
      </div>
    </div>
  )
}
