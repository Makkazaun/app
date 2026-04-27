# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

There is no test suite configured.

## Stack

- **Next.js 16.2.3** with App Router — **read `node_modules/next/dist/docs/` before writing any Next.js code**, as this version contains breaking changes from common training data
- **React 19.2.4**, **TypeScript**, **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Resend** (`resend` package) for transactional email via `app/api/anfrage/route.ts`

## Architecture

### Routes

| Path | Description |
|------|-------------|
| `/` | Public landing page — redirects to `/dashboard` if logged in |
| `/login` | Login + registration (placeholder — no real auth backend yet) |
| `/konfigurator` | 6-step product configurator |
| `/dashboard` | Customer dashboard (Anfragen, Angebote, Rechnungen, Termine) |
| `/api/anfrage` | POST — sends admin + customer confirmation emails via Resend |
| `/agb`, `/datenschutz`, `/impressum` | Static legal pages |

### Auth (`lib/auth.ts`)

Session stored in `localStorage` under key `edelzaun_auth` as `{ email, ts }`. Login/register logic in `app/login/page.tsx` is currently a **placeholder** — it accepts any email+password without a real backend. The `getSession()` / `isLoggedIn()` helpers are used across components.

### Data Store (`lib/store.ts`)

All customer `AnfrageRecord` data is persisted in `localStorage` under keys `ez_anfragen_<userId>`. A pending (guest) request is held under `ez_pending_req`. The store is built around an **`AnfrageAdapter` interface** — the current `localAdapter` is the only implementation, but the design is intended for drop-in replacement with a Supabase client without changing calling code. The target PostgreSQL schema is documented in the file header.

**Flow for guest-to-user transition:** Konfigurator saves a pending record (`savePendingAnfrage`) → user logs in or registers → `claimPendingAnfrage(email)` moves it from `ez_pending_req` into the user's store.

### Konfigurator (`app/konfigurator/page.tsx` + `components/konfigurator/`)

6-step wizard holding all state in a single `FormData` object (defined in `components/konfigurator/types.ts`). Step 2 renders different components depending on `data.produkt` (`betonzaun` / `doppelstabmatte` / `schmiedekunst`). On submit, it calls `/api/anfrage` (email), then saves locally and redirects logged-in users to `/dashboard`.

### Email (`lib/email-template.ts`)

Builds admin and customer HTML/text emails. The API route at `app/api/anfrage/route.ts` sends two emails per submission: one to `anfrage@edelzaun-tor.de` (admin) and one confirmation to the customer.

### Environment Variables

```
NEXT_PUBLIC_SUPERCHAT_KEY   # Superchat widget (client-side)
RESEND_API_KEY              # Resend — domain edelzaun-tor.de must be verified
```

### JTL-Wawi Database (MS SQL Server 2017, database `eazybusiness`)

Key verified schemas and tables:
- `Verkauf.tAuftrag` — `kAuftrag`, `kKunde`, `cAuftragsNr`, `nType` (0=Angebot, 1=Auftrag), `nAuftragStatus`, `nStorno`
- `Verkauf.tAuftragEckdaten` — `kAuftrag`, `fWertNetto`, `fWertBrutto`
- `Rechnung.tRechnung` — `kRechnung`, `kKunde`, `cRechnungsnr`, `nRechnungStatus`, `nStorno`, `nIstEntwurf` (**no** `kAuftrag`, **no** `nBezahlt`)
- `Rechnung.tRechnungEckdaten` — `kRechnung`, `nZahlungStatus` (0=offen, 1=teilweise, 2=komplett), `fVkBruttoGesamt`, `fVkNettoGesamt`, `fOffenerWert`, `cAuftragsnummern` (links to `tAuftrag.cAuftragsNr`)
- `Zahlungsabgleich.lvAuftragZahlungszuordnung` — view with `kBestellung`, `cBestellnummer` (= `cAuftragsNr`), `nZahlungStatus`
- `Verkauf.tRechnung` — **does not exist** in this JTL version; always use `Rechnung.tRechnung`

Payment status for an Auftrag is derived from `Rechnung.tRechnungEckdaten.nZahlungStatus` via `cAuftragsnummern = tAuftrag.cAuftragsNr`.
- `dbo.tAdresse` — `nTyp` values: **1 = Rechnungsadresse**, **0 = Lieferadresse** (not 2!); `nStandard = 1` marks the primary billing address

PDF uploads: `POST /api/jtl/internal/upload-pdf` (Bearer `JTL_API_KEY`), stored in `private/documents/`.

### Design System

Dark theme throughout. Primary accent color: `#c9a84c` (gold). Background base: `#1a1a1a`. All colors are applied via inline `style` props, not Tailwind color classes.
