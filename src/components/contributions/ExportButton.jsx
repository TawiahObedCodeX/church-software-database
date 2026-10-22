import { useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

/**
 * Dropdown CSV export.
 *
 * Each option maps to one report builder in utils/csvUtils. Downloads
 * happen entirely client-side and open directly in Excel thanks to the
 * UTF-8 BOM those builders prepend.
 */
export function ExportButton({ options, variant = 'secondary', size = 'sm', label = 'Export CSV' }) {
  const [open, setOpen] = useState(false)
  const [lastExport, setLastExport] = useState(null)

  function run(option) {
    const count = option.run()
    setOpen(false)
    setLastExport({ label: option.label, count })
  }

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        icon={Download}
        iconRight={ChevronDown}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </Button>

      {open ? (
        <>
          {/* Click-away layer */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />

          <div
            role="menu"
            className="animate-rise absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-pop"
          >
            <p className="px-3 py-2 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              Download a report
            </p>

            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                role="menuitem"
                onClick={() => run(option)}
                className="flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-ink-50"
              >
                <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-jade-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-800">{option.label}</span>
                  <span className="block text-xs text-ink-500">{option.hint}</span>
                </span>
              </button>
            ))}

            <p className="border-t border-ink-100 px-3 pt-2 pb-2 text-[11px] text-ink-400">
              Opens in Excel or Google Sheets.
            </p>
          </div>
        </>
      ) : null}

      {lastExport ? (
        <p className={cn('mt-1.5 text-xs text-jade-600')} role="status">
          {lastExport.label} exported
          {typeof lastExport.count === 'number' ? ` (${lastExport.count} rows)` : ''}.
        </p>
      ) : null}
    </div>
  )
}
