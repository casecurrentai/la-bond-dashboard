# BondCurrent TODO

## Core Features
- [x] Database schema: bookings, bonds, charges, sources, snapshots tables
- [x] Server-side adapters: St. Mary, Allen, Evangeline parish scrapers
- [x] tRPC API routes: bookings, bonds, stats, sources, scrape trigger
- [x] Dashboard page: stats cards, bookings table, parish filter
- [x] Design system: BondCurrent AI/law enforcement dark theme
- [x] Responsive layout for mobile
- [x] Vitest tests for backend procedures (25/25 passing)

## BondCurrent Pivot - River Parishes + Voice + Risk Memo
- [x] Research river parishes (St. John Baptist, St. James, Plaquemines, St. Bernard, Jefferson, Orleans)
- [x] Rebrand to BondCurrent with sleek AI/law enforcement aesthetic
- [x] Add charge/offense field to search (in addition to name)
- [x] Build adapters for all accessible river parishes (Plaquemines, St. Bernard, Orleans, Jefferson)
- [x] Integrate voice search (speech-to-text for name/charge queries)
- [x] Write comprehensive risk memo (robots.txt, TOS, rate limiting, data retention)
- [x] Test all adapters and search functionality (25/25 passing)
- [x] Verifier script: node scripts/verify-source.mjs --parish <name> --all --list
- [x] Save evidence files (HTML snapshots + verify logs) to /outputs
- [x] Parish source status panel in UI showing bond availability per parish

## Pending / Future
- [ ] Implement auto-refresh cron every 30 minutes (server-side)
- [ ] Build email/SMS notification system for bond alerts
- [ ] Bond detail view with charge history
- [ ] Jefferson Parish Playwright adapter (blocked in sandbox, works in production)
- [ ] St. John Baptist Parish adapter (Zuercher portal)
- [ ] St. James Parish adapter (domain not resolving)

## Frontend Design Cleanup
- [x] Audit and fix CSS theme — tighten color palette, fix inconsistencies
- [x] Improve typography hierarchy — Syne display, DM Sans body, DM Mono data
- [x] Fix navbar — cleaner layout, better logo treatment
- [x] Fix hero section — remove clutter, stronger headline
- [x] Fix stats bar — better card design, cleaner numbers
- [x] Fix search section — cleaner input, better toggle buttons
- [x] Fix results cards — better information hierarchy
- [x] Fix parish status panel — cleaner grid layout
- [x] Fix footer — minimal and clean
- [x] Ensure no invisible text or color mismatches

## B2B SaaS Pivot (Voice Screener Platform)
- [x] Extend DB schema: voice_api_calls, voice_calls, companies, voice_agent_configs, api_usage, roster_cache
- [x] POST /api/v1/voice-screener endpoint with premium calc and qualification logic
- [ ] GET /api/v1/parishes endpoint
- [x] Marketing landing page: hero, features, how-it-works, pricing, CTA, footer
- [ ] /pricing page with feature comparison table
- [ ] /how-it-works page
- [ ] /parishes page with coverage map
- [ ] Dashboard layout with sidebar nav
- [ ] Dashboard home: metrics cards, recent calls table, call volume chart, parish activity
- [ ] Call logs page: filters, sortable table, CSV export
- [ ] Call detail page: caller info, inmate info, recording player, transcript, AI summary
- [ ] Configuration page: voice settings, financial settings, parish coverage, API key
- [ ] Billing page: subscription info, usage meter, billing history
- [ ] Mock data: realistic call logs, transcripts, recordings
- [x] Auth guard: redirect unauthenticated users to login
- [ ] Tests for voice screener API
- [x] Checkpoint and publish

## CaseCurrent Branding Match
- [x] Capture CaseCurrent.co colors, fonts, nav, hero, sections
- [x] Update CSS design system to match CaseCurrent branding
- [x] Rebuild marketing landing page matching CaseCurrent layout
- [x] Build authenticated SaaS dashboard with call logs
- [x] Checkpoint and publish

## Mobile UX Fixes

- [x] Add hamburger menu to landing page Navbar for mobile view

## Bug Fixes

- [x] Fix screener search: inmate name lookup returns no results

## No-Bond Fallback Workflow

- [x] Research booking desk phone numbers for all 8 parishes
- [x] Add jail directory (phone, address, hours) to server-side data
- [x] Extend screener API to include jail_contact when bond is missing
- [x] Build NoBondWorkflow UI: phone number, call script, guided steps
- [x] Show workflow automatically when screener_decision is NEEDS_MANUAL_REVIEW or NOT_FOUND

## Bug Fixes Round 2

- [x] Fix screener search not returning results (regression)

## St. John the Baptist Parish Scraper

- [x] Integrate Zuercher Portal adapter for St. John the Baptist
- [x] Add St. John to dashboard parish dropdown
- [x] Test end-to-end screener search for St. John (via background cache warmer)

## Mobile Nav Bug Round 2

- [x] Fix hamburger dropdown not appearing on mobile (menu state not rendering)

## St. John Debug

- [x] Debug St. John search: "Harley D Atkinson" not found despite being incarcerated there

## St. John Fix (IP Block Workaround)

- [x] Add tRPC endpoint to manually trigger St. John cache warm from browser
- [x] Add cache status indicator in dashboard for St. John
- [x] Add client-side Zuercher fetch as fallback when server-side is blocked

## Mobile Dashboard Sidebar Fix

- [x] Hide sidebar by default on ≤768px
- [x] Add hamburger icon top-left to toggle sidebar as slide-over overlay
- [x] Overlay: full-height, ~280px wide, semi-transparent backdrop, tap to close
- [x] Main content fills 100vw when sidebar is hidden
- [x] Dashboard cards stack in single column on mobile
- [x] Move logo + footer into overlay menu (already inside sidebar)
- [x] Keep desktop layout (≥769px) unchanged

## St. John Regression (Round 2)

- [ ] Debug St. John search regression: names not returning results again

## LA VINE Single Adapter (All 6 River Parishes)

- [ ] Verify LA VINE bond amount availability via browser inspection
- [ ] Build single LAVineAdapter class (Playwright, __doPostBack, table parse)
- [ ] Register all 6 parishes in adapters.ts (St. John, Orleans, St. Charles, Ascension, St. James, Assumption)
- [ ] Update cache warmer to include all 6 LA VINE parishes
- [ ] Update dashboard parish dropdown to show all 6 parishes
- [ ] Remove/deprecate Zuercher Portal adapter (keep as fallback)

## Full B2B SaaS Build (v5 Spec)

- [x] Calls Log page (/dashboard/calls): filterable table, mock data, sortable columns, CSV export
- [x] Call detail modal: caller info, inmate info, transcript, AI summary, audio player UI
- [x] Configuration page (/dashboard/config): voice agent settings, financial thresholds, parish toggles, API key
- [x] Billing page (/dashboard/billing): subscription tier, usage meter, billing history table
- [x] Update landing page: 12 parishes count, testimonials, how-it-works section, parish partnership section
- [x] Update dashboard nav: add Calls, Config, Billing links to sidebar
- [x] Mock data: 25 realistic call records with transcripts and summaries
