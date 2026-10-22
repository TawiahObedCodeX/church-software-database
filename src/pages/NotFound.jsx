import { Link } from 'react-router-dom'
import { Compass, LayoutDashboard, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

/** Catch-all route for unknown URLs. */
export function NotFound() {
  return (
    <Card className="mx-auto max-w-lg">
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-navy-50 text-navy-600">
          <Compass className="size-7" aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-lg font-semibold text-ink-900">Page not found</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          This page does not exist in the demo. Try the dashboard or the member register.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button as={Link} to="/" icon={LayoutDashboard}>
            Go to dashboard
          </Button>
          <Button as={Link} to="/members" variant="secondary" icon={Users}>
            Member register
          </Button>
        </div>
      </div>
    </Card>
  )
}
