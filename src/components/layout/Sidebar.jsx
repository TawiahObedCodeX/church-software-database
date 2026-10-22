import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, HandCoins, X } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, hint: 'Overview & charts' },
  { to: '/members', label: 'Members', icon: Users, hint: 'Register & track' },
  { to: '/contributions', label: 'Contributions', icon: HandCoins, hint: 'Giving & pledges' },
]

/**
 * Primary navigation — white surface on a white page, separated by a
 * hairline border. Blue carries the active state, red is reserved for
 * alerts elsewhere in the app.
 *
 * Desktop: fixed sidebar (lg+).
 * Mobile: off-canvas drawer controlled by AppLayout.
 */
export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-200 bg-white transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        {/* Brand — the white dove logo needs a navy plate to read on a
            white sidebar, so it sits on a rounded navy tile. */}
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-navy-800 p-1 shadow-pop ring-1 ring-navy-900/20">
              <img
                src="/lakeside-logo.png"
                alt=""
                width="44"
                height="44"
                className="size-full object-contain"
              />
            </span>

            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-navy-800">Lakeside</p>
              <p className="truncate text-xs text-ink-500">Baptist Church</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 lg:hidden"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mx-5 h-px bg-ink-100" />

        {/* Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, hint }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-navy-50 text-navy-800 ring-1 ring-navy-100 ring-inset'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Blue rail marks the current page. */}
                  <span
                    className={cn(
                      'absolute inset-y-2 -left-3 w-1 rounded-r-full bg-ember-500 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                  />
                  <Icon
                    className={cn('size-4.5 shrink-0', isActive ? 'text-navy-600' : 'text-ink-400')}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{label}</span>
                    <span className="block truncate text-[11px] font-normal text-ink-400">
                      {hint}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer note */}
        <div className="border-t border-ink-100 p-4">
          <div className="rounded-xl bg-ink-50 px-3.5 py-3">
            <p className="text-xs font-medium text-ink-700">Demo data</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
              Records are stored in your browser only. Reset any time from the top bar.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
