import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, Filter, UserPlus, Users } from 'lucide-react'
import { useChurch } from '../context/churchStore'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Alert } from '../components/ui/Alert'
import { SearchInput, Select } from '../components/ui/Input'
import { StatCard } from '../components/ui/StatCard'
import { PageSkeleton } from '../components/ui/Skeleton'
import { MemberForm } from '../components/members/MemberForm'
import { MemberTable } from '../components/members/MemberTable'
import { MEMBER_CATEGORIES, MEMBER_STATUSES, round2 } from '../utils/contributions'
import { exportMembersToCSV } from '../utils/csvUtils'

/** Validation schema shared by the create and edit forms. */
const memberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Enter the full name (at least 3 characters)')
    .max(80, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .regex(/^[+()\d\s-]+$/, 'Phone can only contain digits, spaces, +, - and brackets'),
  email: z.string().trim().email('Enter a valid email address'),
  gender: z.enum(['Male', 'Female'], { message: 'Select a gender' }),
  category: z.enum(MEMBER_CATEGORIES, { message: 'Select a category' }),
  joinDate: z.string().min(1, 'Select the date they joined'),
  address: z.string().trim().max(160, 'Address is too long').optional().or(z.literal('')),
  status: z.enum(MEMBER_STATUSES),
  notes: z.string().trim().max(400, 'Notes are too long').optional().or(z.literal('')),
})

const BLANK_MEMBER = {
  fullName: '',
  phone: '',
  email: '',
  gender: '',
  category: '',
  joinDate: new Date().toISOString().slice(0, 10),
  address: '',
  status: 'Active',
  notes: '',
}

export function Members() {
  const { enrichedMembers, members, contributions, addMember, updateMember, deleteMember } =
    useChurch()
  const loading = useSimulatedLoading(500)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('recent')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [flash, setFlash] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(memberSchema), defaultValues: BLANK_MEMBER })

  /* ---------------- Filtering + sorting ---------------- */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    let rows = enrichedMembers.filter((member) => {
      const matchesQuery =
        !needle ||
        [member.fullName, member.phone, member.email, member.id, member.address]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))

      const matchesCategory = !category || member.category === category
      const matchesStatus = !status || member.status === status

      return matchesQuery && matchesCategory && matchesStatus
    })

    const sorters = {
      recent: (a, b) => (a.joinDate < b.joinDate ? 1 : -1),
      name: (a, b) => a.fullName.localeCompare(b.fullName),
      paid: (a, b) => b.financials.paid - a.financials.paid,
      outstanding: (a, b) => b.financials.outstanding - a.financials.outstanding,
    }

    rows = [...rows].sort(sorters[sort] ?? sorters.recent)
    return rows
  }, [enrichedMembers, query, category, status, sort])

  /* ---------------- Aggregate figures for the cards ---------------- */
  const totals = useMemo(() => {
    return enrichedMembers.reduce(
      (acc, member) => {
        acc.paid = round2(acc.paid + member.financials.paid)
        acc.outstanding = round2(acc.outstanding + member.financials.outstanding)
        return acc
      },
      { paid: 0, outstanding: 0 },
    )
  }, [enrichedMembers])

  /* ---------------- Handlers ---------------- */
  function openCreate() {
    setEditing(null)
    reset(BLANK_MEMBER)
    setFormOpen(true)
  }

  function openEdit(member) {
    setEditing(member)
    reset({
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      gender: member.gender,
      category: member.category,
      joinDate: member.joinDate,
      address: member.address ?? '',
      status: member.status,
      notes: member.notes ?? '',
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    reset(BLANK_MEMBER)
  }

  function onSubmit(values) {
    if (editing) {
      updateMember(editing.id, values)
      setFlash({ tone: 'success', message: `${values.fullName}'s details were updated.` })
    } else {
      const created = addMember(values)
      setFlash({
        tone: 'success',
        message: `${values.fullName} was registered as ${created?.id}.`,
      })
    }
    closeForm()
  }

  function confirmDelete() {
    const name = pendingDelete.fullName
    deleteMember(pendingDelete.id)
    setPendingDelete(null)
    setFlash({ tone: 'success', message: `${name} and their records were removed.` })
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {loading ? (
        <PageSkeleton variant="table" />
      ) : (
        <>
          {flash ? (
            <Alert tone={flash.tone} onDismiss={() => setFlash(null)}>
              {flash.message}
            </Alert>
          ) : null}

          {/* ---------- Summary ---------- */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Registered Members" value={members.length} icon={Users} tone="navy" />
            <StatCard
              label="Active"
              value={members.filter((m) => m.status === 'Active').length}
              icon={Users}
              tone="jade"
            />
            <StatCard
              label="Total Given"
              value={totals.paid}
              money
              icon={Download}
              tone="lake"
              hint="All contributions combined"
            />
            <StatCard
              label="Still Owed"
              value={totals.outstanding}
              money
              icon={Filter}
              tone="amber"
              hint="Unpaid pledge balances"
            />
          </section>

          {/* ---------- Roster ---------- */}
          <Card>
            <CardHeader
              title="Member Register"
              subtitle={`${visible.length} of ${enrichedMembers.length} members shown`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={() => exportMembersToCSV(visible, contributions)}
                    title="Download the member roster as CSV"
                  >
                    Export
                  </Button>
                  <Button size="sm" icon={UserPlus} onClick={openCreate}>
                    Register
                  </Button>
                </div>
              }
            />

            {/* Toolbar */}
            <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:px-5 md:grid-cols-2 xl:grid-cols-4">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search name, phone, email or ID…"
                className="xl:col-span-2"
              />

              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {MEMBER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All status</option>
                  {MEMBER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>

                <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort members">
                  <option value="recent">Newest</option>
                  <option value="name">Name A–Z</option>
                  <option value="paid">Most paid</option>
                  <option value="outstanding">Most owed</option>
                </Select>
              </div>
            </div>

            <MemberTable
              members={visible}
              onEdit={openEdit}
              onDelete={setPendingDelete}
              onAdd={openCreate}
            />
          </Card>
        </>
      )}

      {/* ---------- Create / edit modal ---------- */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        size="md"
        title={editing ? `Edit ${editing.fullName}` : 'Register New Member'}
        description={
          editing
            ? 'Update this member\u2019s details. Their giving history is kept.'
            : 'Capture the details of a new church member.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="member-form"
              disabled={isSubmitting}
              icon={editing ? undefined : UserPlus}
            >
              {editing ? 'Save changes' : 'Register member'}
            </Button>
          </>
        }
      >
        <form id="member-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <MemberForm
            register={register}
            errors={errors}
            mode={editing ? 'edit' : 'create'}
            idPrefix="member"
          />
        </form>
      </Modal>

      {/* ---------- Delete confirmation ---------- */}
      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title="Delete member?"
        description="This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep member
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <Alert tone="warning" title="Their giving history will also be deleted">
          Deleting <strong>{pendingDelete?.fullName}</strong> also removes all{' '}
          {pendingDelete?.financials.contributions ?? 0} contribution record(s) attached to them.
          Consider setting their status to <strong>Inactive</strong> instead if you only want to
          archive them.
        </Alert>
      </Modal>
    </div>
  )
}
