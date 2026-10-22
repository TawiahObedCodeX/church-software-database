import { Menu, RotateCcw, Download, CalendarDays } from 'lucide-react'
import { Button } from '../ui/Button'

/**
 * Sticky navy header. White text on the brand blue, with the church logo
 * on the left. Holds the mobile menu trigger, page title and the global
 * actions (CSV export + demo reset).
 */
export function Topbar({ title, subtitle, onMenuClick, onExport, onReset }) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-30 bg-navy-800 shadow-pop">
      {/* Red accent rule ties the header to the logo's red detail. */}
      <div className="h-1 w-full bg-ember-500" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:py-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/25 text-white transition hover:bg-white/10 lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        {/* Logo shows in the header on small screens, where the sidebar
            is hidden. */}
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-white/30 lg:hidden">
          <img
            src="/lakeside-logo.png"
            alt=""
            width="40"
            height="40"
            className="size-full object-contain"
          />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{title}</h1>
          <p className="hidden truncate text-sm text-navy-100/85 sm:block">{subtitle}</p>
        </div>

        <span className="hidden items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-navy-50 xl:inline-flex">
          <CalendarDays className="size-4 text-navy-200" aria-hidden="true" />
          {today}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="header-ghost"
            size="sm"
            icon={RotateCcw}
            onClick={onReset}
            title="Restore the original demo records"
            className="px-2.5 sm:px-3"
          >
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            variant="header"
            size="sm"
            icon={Download}
            onClick={onExport}
            className="px-2.5 sm:px-4"
          >
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
