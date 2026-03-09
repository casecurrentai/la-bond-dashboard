# LA Bond Dashboard TODO

- [x] Database schema: bookings, bonds, charges, sources, snapshots tables
- [x] Server-side adapters: St. Mary, Allen, Evangeline parish scrapers
- [x] tRPC API routes: bookings, bonds, stats, sources, scrape trigger
- [x] Dashboard page: stats cards, bookings table, parish filter
- [x] Parish map SVG component with interactive filtering
- [x] Design system: Louisiana Cartographic theme (fonts, colors, CSS vars)
- [x] Activity feed: recent bookings and bond changes
- [ ] Bond detail view with charge history
- [x] Responsive layout for mobile
- [x] Vitest tests for backend procedures

- [ ] Add Jefferson Davis parish adapter (bond confirmed)
- [ ] Add DeSoto parish adapter (bond confirmed)
- [ ] Scheduled auto-refresh: server-side cron every 30 minutes
- [ ] Notification system: alert subscriptions DB schema
- [ ] Notification system: email delivery via built-in notification API
- [ ] Notification system: SMS stub interface
- [ ] Subscription UI: alerts preferences page
- [ ] Update Navbar with Alerts link
- [ ] Update tests for new adapters and notification system

## PIVOT: BondCurrent - River Parishes + Voice + Risk Memo
- [ ] Research river parishes (St. John Baptist, St. James, Plaquemines, St. Bernard, Jefferson, Orleans) for inmate roster availability
- [ ] Rebrand to BondCurrent with sleek AI/law enforcement aesthetic
- [ ] Add charge/offense field to search (in addition to name)
- [ ] Build adapters for all 6 river parishes
- [ ] Integrate voice search (speech-to-text for name/charge queries)
- [ ] Implement auto-refresh cron every 30 minutes
- [ ] Build email/SMS notification system for bond alerts
- [x] Write comprehensive risk memo (robots.txt, TOS, rate limiting, data retention)
- [ ] Test all adapters and search functionality
- [ ] Checkpoint and deploy BondCurrent
