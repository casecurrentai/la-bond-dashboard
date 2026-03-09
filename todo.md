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
