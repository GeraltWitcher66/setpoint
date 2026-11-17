# SetPoint — Tennis Club Booking Demo

A complete, production-style demo of a tennis club booking platform: a Persian (RTL) public website, a five-step online booking flow with SMS verification and simulated payment, a customer portal, a data-rich admin dashboard, and a coach panel — all running on mock data in the browser with zero backend required.

**Live demo:** `https://<your-username>.github.io/setpoint/` (update after the first GitHub Pages deployment)

## Demo accounts

| Role | Credentials | Where |
| --- | --- | --- |
| Customer | `09120000000` · code `1234` | `/account/` |
| Admin | `admin@demo.test` · `password` | `/admin/` |
| Coach | `coach@demo.test` · `password` | `/coach/` |

The booking flow's SMS verification uses the demo code `1234`. All payments are simulated.

## Features

### Public site
- Hero, courts with prices and amenities, coaches, weekly group classes, packages, rental equipment, reviews, location and opening hours.
- Dark mode toggle, soft Framer Motion reveals, fully responsive RTL layout.

### Booking flow
- 14-day availability grid for every court, with peak-hour pricing and past/booked/blocked states.
- Optional coach (filtered by working hours and time off) and optional equipment with stock-aware quantity pickers.
- SMS-code verification (demo code) and a simulated online payment.
- Package redemption, booking confirmation code and links to the customer panel.

### Customer portal
- Phone + SMS-code login.
- Upcoming and past reservations, one-click rebook, cancellation with the free/late policy preview and credit refunds.
- Package credit tracking (sessions used / remaining / expiry).
- Waitlist requests and status.
- Printable invoice (browser print dialog → save as PDF) and post-game review with star rating.

### Admin dashboard
- Today's bookings, per-court occupancy, daily/weekly/monthly revenue.
- 14-day revenue chart (Recharts) and equipment/coach revenue breakdown.
- Demand heatmap by weekday and hour.
- Daily and weekly court grids with drag-and-drop reservation moves and conflict validation.
- Manual booking for walk-in/phone customers.
- Rain bulk-cancellation for outdoor courts with credit refunds and package session restoration.
- Full reservation table: mark completed/no-show, admin cancellation, equipment pickup/return tracking.
- Client-side Excel export of reservations (SheetJS).
- Management of courts, coaches, group classes, equipment stock, packages, pricing rules/peak hours, holidays.
- Customer list with spend history, credit, notes and blocking.

### Coach panel
- Upcoming/past sessions and assigned group classes.
- Weekly working-hours editor and time-off ranges.
- Student list derived from sessions/classes, with progress notes.

### Demo experience
- Dismissible site-wide banner: «این یک نسخه نمایشی است؛ دادهها واقعی نیستند.»
- Demo data is regenerated relative to today's date, so the calendar is always current.

## Tech stack

- **Next.js 16** (App Router, static export, Turbopack)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** with a tennis-green / neon-yellow design system and dark mode
- **Framer Motion** for micro-animations
- **Recharts** for the admin revenue chart
- **SheetJS (xlsx)** for the Excel export
- **Vitest** for the availability/pricing engine tests
- **GitHub Pages** via GitHub Actions

## Project structure

```
app/                 Routes: /, /booking, /account, /admin, /coach
components/          UI primitives, public sections, booking wizard, panels
config/site.ts       Club-specific config (brand, courts, currency, rules, demo accounts)
lib/
  booking/           Availability + pricing + cancellation engine, tests, actions
  mock/              Seed data, date helpers, localStorage database
  data/              Repository helpers and the useDatabase hook
  admin/             Dashboard statistics helpers
  currency.ts        Currency formatting (Toman → configured currency)
  invoice.ts         Printable/PDF invoice
  export.ts          Excel export
```

## Data layer (mock + localStorage)

- `lib/mock/seed.ts` builds a deterministic dataset:
  - 4 courts (2 indoor hard, 1 floodlit outdoor hard, 1 outdoor clay)
  - 4 coaches, 3 weekly group classes, 8 equipment types, 2 packages
  - 12 customers (one blocked), 60 reservations spanning two weeks back and two weeks forward, plus 2 blocked maintenance/tournament slots
  - 10 reviews, 3 waitlist entries, 2 customer packages, pricing rules and holidays
- `lib/mock/db.ts` persists the whole database under the versioned key `setpoint.v1.db`. If the stored dataset belongs to a previous day or schema version, it is reseeded automatically, keeping the demo fresh.
- `updateDatabase()` clones the current snapshot, applies a mutation and notifies subscribers, so React (`useSyncExternalStore` via `useDatabase`) re-renders immediately and other tabs stay in sync through the `storage` event.
- `lib/data/store.ts` exposes read/mutation helpers; `lib/booking/actions.ts` contains domain operations (create, cancel, move, rain-cancel, waitlist, package credit).
- The admin header has a **«بازنشانی دمو»** button that clears the local database and reseeds it.

### Connecting a Laravel backend

The UI never talks to `localStorage` directly — it goes through `lib/data/store.ts` and `lib/booking/actions.ts`. To connect Laravel:

1. Replace those module functions with `fetch` calls, e.g.:

   | UI function | Suggested endpoint |
   | --- | --- |
   | `getCourts` / `getCoaches` | `GET /api/courts`, `GET /api/coaches` |
   | `getDaySchedule` inputs | `GET /api/courts/{id}/availability?date=` |
   | `createBooking` | `POST /api/bookings` |
   | `cancelBooking` | `POST /api/bookings/{id}/cancel` |
   | `moveBooking` | `PATCH /api/bookings/{id}` |
   | `joinWaitlist` | `POST /api/waitlist` |
   | `addReview` | `POST /api/bookings/{id}/review` |
   | Rain cancellation | `POST /api/admin/bookings/cancel-rain` |
   | Excel export data | `GET /api/admin/bookings?from=&to=` |

2. Keep the TypeScript interfaces in `lib/types.ts` as the API contract, or bind them to Laravel API Resources.
3. Move auth to Laravel Sanctum: replace `lib/auth.ts` with token storage and guard the `/admin`, `/coach` and `/account` routes (the current demo session is client-only).
4. Move pricing and cancellation rules server-side, or keep `lib/booking/engine.ts` as the shared specification.
5. Replace setup keys in `config/site.ts`; currency and prices are stored in Toman and converted for display.
6. Set `NEXT_PUBLIC_BASE_PATH` to empty and deploy behind a Laravel-served domain if the app is no longer hosted on GitHub Pages.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # static export to ./out
npm test         # run the Vitest engine tests
npm run lint     # ESLint
npm start        # serve the built ./out folder
```

## Deploying to GitHub Pages

1. Push the repository to GitHub (`main` branch).
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. The workflow at `.github/workflows/deploy.yml` builds with `NEXT_PUBLIC_BASE_PATH=/<repo-name>` and publishes `./out`.
4. For a custom domain (or a `<user>.github.io` repository), remove that environment variable from the workflow.

Because every route is exported as `/<route>/index.html`, refreshing deep links such as `/admin/` works on GitHub Pages. `public/.nojekyll` keeps the `_next` assets available.

## Configuration

Everything client-specific lives in `config/site.ts`:

- club name/branding, tagline, city, address, phone
- theme colors used by the logo mark
- currency (`IRT`, `AED`, `TRY`) with `tomanPerUnit` and fraction digits — all stored prices are in Toman and converted at render time
- opening hours, slot length, advance-booking window, cancellation policy
- demo accounts and SMS code

To repurpose the demo for padel, squash or futsal, update this file, the court types in `lib/mock/seed.ts`, and the copy in `lib/copy.ts`.

## Notes and limitations

- All data and authentication are local to the browser; clearing storage resets the demo.
- Payments, SMS and email are simulated.
- The printable invoice uses the browser's print dialog (choose “Save as PDF” to download).
- Images are stored locally under `public/images/` and were sourced from Unsplash.
