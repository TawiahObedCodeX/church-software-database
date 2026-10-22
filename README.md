# Lakeside Baptist Church &middot; Admin Console

A **frontend-only** demo of a church administration system: member records,
contributions, step-by-step pledge payments, an analytics dashboard, and CSV
exports that open directly in Excel.

No backend, no database. All records live in React state and are mirrored to
`localStorage`, so the demo is fully interactive and survives a page refresh.

---

## What it does

| Area | Capability |
| --- | --- |
| **Members** | Register new members with full details, edit them, search/filter/sort the roster, view an individual giving profile, delete (with cascade to their contributions). |
| **Contributions** | Record offerings, tithes, donations, welfare and goal-based contributions (pledge, fundraising, building fund, missions). |
| **Installments** | A member can pay "bit by bit" against a target. The app tracks paid / remaining / percentage until the target is fully settled. |
| **Tracking** | The admin sees exactly what each member has paid so far, per campaign and in total, plus who still owes money. |
| **Member profile graphs** | Every profile carries its own charts: giving month by month, and the member's overall pledge position. |
| **Record from the profile** | The admin can take the next installment straight from a member's profile — the dashboard and the profile both update in the same render. |
| **Dashboard** | KPI cards, a 6-month giving trend chart, giving-by-type donut, collection pace chart, campaign progress bars, recent payments and a follow-up list. |
| **CSV export** | Six reports, each downloaded client-side and encoded so Excel opens them cleanly. |
| **Timestamps** | Every installment stores the date **and time** it was recorded, plus the month it counts towards. |
| **Responsive** | Mobile-first layout: off-canvas nav drawer, horizontally scrollable tables, stacking grids. |
| **Skeleton loading** | Pages show shimmering skeleton placeholders while their data "arrives", instead of a blank screen. |

### The pledge lifecycle

This is the heart of the app:

```
Pending          Paid = 0
Partially Paid   0 < Paid < Target      -> admin records installments over time
Completed        Paid >= Target         -> outstanding reaches exactly 0
```

Goal-based types (`Pledge`, `Fundraising`, `Building Fund`, `Missions`) carry a
target. One-off types (`Offering`, `Tithe`, `Donation`, `Welfare`) settle
immediately with a single amount and have no outstanding balance.

A part-paid pledge **stays open**, so a member can keep paying towards it in as
many installments as they need. Payments against a goal are **capped at the
outstanding balance**, so a pledge can never be overpaid — if the admin types
more than is owed, the amount is trimmed to the exact balance and a warning
explains the adjustment. The cap is enforced in the **store**, not only in the
form, so it holds no matter which screen the payment is recorded from.

### Recording a payment

There are two entry points, and both write through the same store mutation:

1. **Contributions → Pledge view** — pick a contribution, open its payment form.
2. **Member profile → any open pledge → "Record payment"** — the same modal, so
   the admin never has to leave the member's page.

Because both go through `addPayment`, the member's profile, the member rollup,
the dashboard KPIs and every chart recalculate from the same source in a single
render.

---

## Tech stack

- **React 19** + **Vite** (Rolldown)
- **Tailwind CSS v4** via `@tailwindcss/vite` — theming lives in `@theme` tokens in `src/index.css`, no `tailwind.config.js`
- **React Router v7** — `createBrowserRouter`
- **Recharts** — every chart: dashboard, collection pace, per-pledge progress, per-member track record
- **React Hook Form** + **Zod** — form state and validation
- **lucide-react** — icons
- **clsx** + **tailwind-merge** — the `cn()` class helper

> `date-fns`, `react-csv` and `react-is` are in `package.json` but unused. The
> app formats dates and builds CSVs with its own helpers in `src/utils/`, and
> `react-is` is only needed by Recharts in some setups. They can be removed.

---

## Branding

The palette is derived from the Lakeside Baptist Church identity — **white
ground, navy blue, black and red** — mapped onto `@theme` tokens in
`src/index.css`:

| Token | Used for |
| --- | --- |
| `navy-*` | Sidebar/header chrome, primary buttons, pledge callouts |
| `lake-*` | Secondary blue accents, completion stats |
| `jade-*` | Money received, settled pledges — the only non-brand green |
| `ember-*` | Outstanding balances, warnings, the running-total line |
| `ink-*` | Text and borders, from near-black down to hairline greys |

The shared church logo lives at `public/lakeside-logo.png` (white dove with red
details) and sits on a navy tile so it reads against the white background.
Currency is `GHS` / `GH₵`, changeable in `src/utils/contributions.js`.

---

## Getting started

### With Yarn (recommended)

```bash
yarn install
yarn dev
```

Then open the printed `http://localhost:5173` URL.

### With npm

```bash
npm install
npm run dev
```

### Scripts

| Command | Purpose |
| --- | --- |
| `yarn dev` | Start the dev server with HMR |
| `yarn build` | Production build into `dist/` |
| `yarn preview` | Serve the production build locally |
| `yarn lint` | Run ESLint |
| `yarn test` | Run the money-math, timestamp, per-member and CSV smoke tests |

### Install from scratch

If you are recreating the project from an empty folder:

```bash
yarn add react react-dom react-router-dom recharts \
  react-hook-form zod @hookform/resolvers lucide-react \
  date-fns clsx tailwind-merge \
  tailwindcss @tailwindcss/vite

yarn add -D vite @vitejs/plugin-react eslint @eslint/js \
  eslint-plugin-react-hooks eslint-plugin-react-refresh globals \
  @types/react @types/react-dom vite-node
```

> **Note on `@hookform/resolvers`:** version 6 requires `effect@^4` while its
> optional `@typeschema` peer chain requires `effect@^3`, which makes npm/yarn
> fail with `ERESOLVE`. This project pins `^5.9.2`, which resolves cleanly and
> supports `zod@4`.

---

## Project structure

```
src/
├── App.jsx                     Routes + provider wiring
├── main.jsx                    Entry point
├── index.css                   Tailwind v4 import + @theme design tokens
│
├── context/
│   ├── churchStore.js          Context object + useChurch / useMember hooks
│   └── ChurchContext.jsx       ChurchProvider: all state and mutations
│
├── data/
│   └── mockData.js             Seed members + contributions (dates + times
│                               relative to today, so charts always render)
│
├── hooks/
│   └── useSimulatedLoading.js  Drives the skeleton states, keyed on deps
│
├── lib/
│   └── cn.js                   clsx + tailwind-merge helper
│
├── utils/
│   ├── contributions.js        Domain constants + progress, financials,
│   │                           timestamps and per-member derivations
│   ├── stats.js                Dashboard aggregation (trend, breakdown,
│   │                           campaigns, collection pace)
│   ├── csvUtils.js             CSV builders + browser download
│   └── format.js               Currency, date, number formatting
│
├── components/
│   ├── ui/                     Button, Input, Select, Card, Modal, Badge,
│   │                           StatCard, ProgressBar, Alert, EmptyState,
│   │                           Skeleton
│   ├── layout/                 AppLayout, Sidebar, Topbar
│   ├── dashboard/              KPI cards, trend chart, donut, campaigns,
│   │                           activity, CollectionPaceChart
│   ├── members/                MemberForm, MemberTable,
│   │                           MemberProgressCharts (profile graphs)
│   └── contributions/          ContributionForm, ContributionTable,
│                               PaymentForm, PledgeProgressChart, ExportButton
└── pages/
    ├── Dashboard.jsx           KPIs + charts + campaigns + activity
    ├── Members.jsx             Roster, filters, create/edit/delete
    ├── MemberProfile.jsx       One member's details, progress graphs,
    │                           record-payment modal, history
    ├── Contributions.jsx       Ledger, pledge view, installments, exports
    └── NotFound.jsx            404
```

### Architecture notes

- **Calculation logic is pure and separate from React.** `utils/contributions.js`
  and `utils/stats.js` take plain arrays and return plain objects. That is why
  they can be unit-tested without rendering anything.
- **One store, memoised derivations.** `ChurchProvider` holds the raw `members`
  and `contributions` arrays. Everything else (`dashboard`, `enrichedMembers`)
  is computed with `useMemo` from those arrays — there is no duplicated state to
  drift out of sync.
- **Ids are assigned by the store**, not by form components, so React components
  stay pure.
- **`addPayment` returns three things**, and callers must handle all of them: the
  created payment object on success, a **rejection string** when the store
  refuses the payment, or `null` when the contribution id is unknown. Check
  `typeof result === 'string'` before treating a result as success.
- **Timestamps are the single source of time.** A payment stores an ISO
  `timestamp` (the chosen calendar date plus the moment of entry) and helpers
  derive the month key from it. Legacy date-only records are backfilled to noon
  on their original date when loaded.

---

## Charts

Every chart is a Recharts component fed by a pure derivation, so the numbers on
a graph are the same numbers the tables and CSVs use.

| Chart | Where | Shows |
| --- | --- | --- |
| **Monthly Giving Trend** | Dashboard | Money received over the last 6 continuous months |
| **Giving by Type** | Dashboard | Donut splitting offerings, tithes, pledges, etc. |
| **Collection Pace** | Dashboard | Cumulative pledge money collected against the flat "total pledged" ceiling |
| **Pledge Progress** | Payment modal | One pledge's climb from first installment to target |
| **Giving Track Record** | Member profile | That member's monthly giving, bars plus a running-total line |
| **Pledge Position** | Member profile | Everything the member pledged versus everything cleared, month by month |

**Collection Pace counts goal-based payments only.** Including one-off giving
would let the collected line cross the pledged ceiling, which would be
meaningless — you cannot collect more than was promised.

The member profile's **Giving Track Record** counts *all* of that member's
giving (pledges *and* one-off), because a member tracking their own record
wants to see everything they have given. Its running-total line therefore sits
above the **Pledge Position** chart's line, which deliberately excludes one-off
gifts.

---

## CSV exports

Every export is generated in the browser and downloaded as a Blob. Two details
make them open correctly in Excel:

1. A **UTF-8 BOM** is prepended so Excel detects the encoding and does not
   mangle accented characters.
2. Values are escaped per **RFC 4180** — quoted whenever they contain a comma,
   quote, or newline, with embedded quotes doubled.

Six reports are available. Five are built by `src/utils/csvUtils.js`; the member
statement is assembled inline in `MemberProfile.jsx` so it can be scoped to one
member:

| Report | Where | One row per |
| --- | --- | --- |
| Member roster | Members page, Topbar | Member, with paid/pledged/outstanding |
| Contribution ledger | Contributions page | Contribution, with target and balance |
| Installment / payment log | Contributions page | Individual payment received, with **Month Paid** and **Time Paid** columns |
| Pledge tracker | Contributions page | Goal-based contribution, largest debt first, with **Last Payment** timestamp |
| Church summary | Dashboard (Topbar), Contributions page | Totals + per-campaign + recent activity |
| Member statement | Member profile | That member's contributions only |

---

## Verification

The project ships with a dependency-free smoke test covering the money math,
the timestamps, the per-member derivations and the CSV encoder:

```bash
yarn test
```

**46 checks** currently pass. It asserts real invariants, for example:

- a fully paid pledge reports `outstanding === 0` and status `Completed`
- a 1200 target with a 300 payment reports 900 outstanding at 25%
- overpayment clamps progress to 100%
- `outstanding === goalPledged - goalReceived` across the whole dataset
- `goalReceived + oneOffReceived === totalReceived`
- collection rate stays at or below 100%
- a recorded payment keeps its chosen calendar date but gains the entry time
- a member's timeline cumulative equals everything that member paid
- the member **pledge** cumulative excludes one-off giving
- a member's monthly buckets are continuous, with no silently skipped months
- CSV quoting handles commas, quotes and newlines; rows use CRLF

All three commands are expected to pass:

| Command | Expected |
| --- | --- |
| `yarn lint` | no errors, no warnings |
| `yarn test` | 46 checks passed |
| `yarn build` | succeeds |

> `yarn build` prints a chunk-size warning: the main bundle is ~1.0 MB
> (~299 kB gzipped), almost entirely Recharts. This is a warning, not a failure.
> Code-splitting the chart-heavy routes would fix it.

---

## Known limitations (by design, it's a frontend demo)

- **No backend or auth.** Data is per-browser in `localStorage` (key
  `lakeside-baptist-console-v1`). Clearing site data or using another browser
  gives you a fresh copy of the seed data.
- **most-recent-first ordering** for lists; no server-side pagination.
- **Single currency.** Change `CURRENCY` in `src/utils/contributions.js` to
  reprice the entire UI.
- **No date-range picker** on the dashboard; the trend chart shows the last 6
  months and the member charts cap at 12.
- **Tables scroll horizontally on mobile** (`min-w-[860px]`) rather than
  collapsing into cards.
- Use the **Reset** button in the top bar to restore the original demo records.

---

## Accessibility

- Semantic table markup with `<caption>` and `scope="col"` headers.
- Modals trap focus on open, close on `Escape`, lock background scroll, and are
  labelled via `aria-labelledby`.
- Progress bars expose `role="progressbar"` with `aria-valuenow`.
- Visible `:focus-visible` outlines; icons are `aria-hidden` with labels on
  icon-only buttons.
- `prefers-reduced-motion` is respected (animations collapse to ~0ms), including
  the skeleton shimmer, which stops animating entirely.
- Every chart is backed by the same numbers shown in text and tables, so no
  information is available *only* visually.
- Color is never the sole signal: settled/outstanding states carry a word
  ("Fully paid", "Still to pay") alongside red or green.
