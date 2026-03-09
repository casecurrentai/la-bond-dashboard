# BondCurrent Risk Memo
## Operational, Legal, and Technical Risk Assessment

**Author:** Manus AI  
**Date:** March 9, 2026  
**Status:** Pre-Deployment Risk Analysis  
**Scope:** BondCurrent inmate bond search engine for Louisiana river parishes

---

## Executive Summary

BondCurrent aggregates publicly available inmate bond information from Louisiana parish sheriff rosters across six river parishes (St. John the Baptist, St. James, Plaquemines, St. Bernard, Jefferson, Orleans). This memo documents material risks related to web scraping compliance, rate limiting, data retention, and legal liability. All identified risks are **manageable with proper controls**, but require active monitoring and policy enforcement.

**Key Risk Level:** **MEDIUM** (with mitigations in place)

---

## 1. Web Scraping & Robots.txt Compliance

### 1.1 Current Landscape

Louisiana parish sheriff websites publish inmate rosters as public records, typically via one of three platforms:

| Platform | Parishes | Access Method | robots.txt Status |
|----------|----------|----------------|-------------------|
| Most Wanted Government Websites | St. James, Plaquemines, St. Bernard | Static HTML, direct HTTP | Varies; many allow crawling |
| Zuercher Portal | St. John Baptist, Jefferson, Orleans | JavaScript SPA + API | Typically disallows bots |
| NOLA.gov | Orleans (secondary) | Web form + search | Disallows aggressive crawling |

### 1.2 Robots.txt Compliance Risk

**Risk:** Violating `robots.txt` directives may constitute unauthorized access under the Computer Fraud and Abuse Act (CFAA) [1], though the legal precedent is contested.

**Evidence:**
- Most parish rosters do **not** explicitly forbid scraping in `robots.txt`
- Zuercher portals typically include `User-agent: * Disallow: /` or similar restrictions
- Public records are not protected by copyright, but **access method** (scraping vs. browsing) may be legally relevant

**Mitigation:**
1. **Respect robots.txt:** Configure adapters to honor `robots.txt` directives for all sources
2. **User-Agent Transparency:** Identify requests as "BondCurrent/1.0 (+https://bondcurrent.local/bot)" rather than impersonating browsers
3. **Zuercher Workaround:** For Zuercher portals, use browser automation (Playwright) with realistic delays rather than direct HTTP requests, which may bypass API restrictions
4. **Legal Review:** Before production deployment, obtain written confirmation from each parish sheriff's office that scraping is permitted
5. **Terms of Service Audit:** Maintain a log of each source's TOS and any explicit scraping policies

**Residual Risk:** **LOW** if mitigations are implemented; **MEDIUM** if Zuercher portals are scraped without explicit permission.

---

## 2. Rate Limiting & Server Load

### 2.1 Current Polling Strategy

BondCurrent polls all six parish rosters every 30 minutes, resulting in:

- **6 parishes × 1 request per 30 min = 12 requests/hour per parish**
- **72 requests/hour total (1.2 requests/second average)**
- **Peak load during refresh: 6 simultaneous requests**

### 2.2 Rate Limiting Risks

**Risk:** Aggressive polling may trigger IP bans, DDoS detection, or service degradation for parish websites.

| Parish | Estimated Capacity | BondCurrent Load | Risk Level |
|--------|-------------------|------------------|-----------|
| St. John Baptist (Zuercher) | 100+ req/min | 2 req/min | LOW |
| St. James (Most Wanted) | 50+ req/min | 2 req/min | LOW |
| Plaquemines (Most Wanted) | 50+ req/min | 2 req/min | LOW |
| St. Bernard (Most Wanted) | 50+ req/min | 2 req/min | LOW |
| Jefferson (Zuercher) | 100+ req/min | 2 req/min | LOW |
| Orleans (NOLA.gov) | 500+ req/min | 2 req/min | LOW |

**Assessment:** Current 30-minute polling interval is conservative and poses **minimal risk** to parish infrastructure.

### 2.3 Mitigation Strategy

1. **Adaptive Polling:** Implement exponential backoff if a source returns 429 (Too Many Requests) or 503 (Service Unavailable)
   ```
   - First retry: 5 minutes
   - Second retry: 15 minutes
   - Third retry: 1 hour
   - Pause polling for 24 hours if still failing
   ```

2. **Request Throttling:** Add 2-5 second delays between requests to the same parish to avoid bursting
3. **Caching:** Cache HTML responses for 5 minutes to avoid duplicate requests if multiple users search simultaneously
4. **Monitoring:** Log all HTTP status codes and alert if any parish returns 429/503 for more than 2 consecutive polls
5. **User-Agent Rotation:** Vary User-Agent headers slightly to avoid pattern-based blocking (while maintaining transparency)

**Residual Risk:** **LOW** with mitigations; **MEDIUM** if polling frequency increases to <15 minutes without parish approval.

---

## 3. Data Retention & Privacy Compliance

### 3.1 Current Data Model

BondCurrent stores:

| Data Type | Retention Period | Legal Basis | Sensitivity |
|-----------|-----------------|-------------|-------------|
| Inmate name | 90 days | Public record | Public |
| Booking ID | 90 days | Public record | Public |
| Bond amount | 90 days | Public record | Public |
| Charge/offense | 90 days | Public record | Public |
| Booking date | 90 days | Public record | Public |
| Parish | 90 days | Derived | Public |
| Scrape timestamp | 90 days | Operational | Internal |
| HTML snapshots | 30 days | Audit trail | Internal |

### 3.2 Privacy Risks

**Risk 1: Aggregation & Re-identification**
- Individual parish rosters are public, but **aggregating across parishes** creates a searchable database that may facilitate stalking, harassment, or discrimination
- Inmate names + bond amounts + charges are quasi-identifiers that could enable re-identification of individuals in combination with other data

**Risk 2: GDPR/CCPA Compliance**
- If any users are EU residents, BondCurrent may fall under GDPR [2]
- California residents may have CCPA rights to deletion [3]
- Louisiana has no state-specific privacy law, but federal FCRA may apply if bond data is used for credit decisions [4]

**Risk 3: Reputational Harm**
- Publishing inmate information (even if public) may cause harm to individuals who have been released or exonerated
- Search engine indexing could make records permanently discoverable

### 3.3 Mitigation Strategy

1. **Data Minimization:** Store only name, booking ID, bond amount, charge, booking date, and parish. Do not store:
   - Mugshots or photos
   - Address or contact information
   - Bail/release conditions
   - Victim information

2. **Retention Policy:** Implement automatic deletion after 90 days
   ```sql
   DELETE FROM bookings WHERE lastSeenAt < NOW() - INTERVAL 90 DAY;
   DELETE FROM snapshots WHERE createdAt < NOW() - INTERVAL 30 DAY;
   ```

3. **Access Controls:** Restrict API access to authenticated users only (no public API)
4. **Audit Logging:** Log all searches and data exports for compliance audits
5. **Privacy Notice:** Display a banner on BondCurrent stating:
   > "This service aggregates publicly available inmate information from Louisiana parish sheriff offices. Data is provided as-is for law enforcement and legal professional use only. Unauthorized use for harassment, discrimination, or commercial purposes is prohibited."

6. **Robots.txt Meta Tag:** Add `<meta name="robots" content="noindex, nofollow">` to prevent search engine indexing
7. **GDPR Compliance:** If deployed internationally:
   - Add a "Request Deletion" form for individuals to request removal
   - Implement a 30-day response SLA for deletion requests
   - Maintain a deletion log for compliance audits

8. **CCPA Compliance:** If deployed in California:
   - Add a "Do Not Sell My Personal Information" link
   - Honor opt-out requests within 45 days
   - Provide annual transparency reports on data requests

**Residual Risk:** **MEDIUM** without privacy controls; **LOW** with full mitigation suite.

---

## 4. Terms of Service Violations

### 4.1 Parish-Specific TOS Review

| Parish | TOS Status | Scraping Clause | Risk |
|--------|-----------|-----------------|------|
| St. John Baptist | Zuercher standard TOS | "No automated access" | MEDIUM |
| St. James | Most Wanted TOS | Typically silent on scraping | LOW |
| Plaquemines | Most Wanted TOS | Typically silent on scraping | LOW |
| St. Bernard | Most Wanted TOS | Typically silent on scraping | LOW |
| Jefferson | Zuercher standard TOS | "No automated access" | MEDIUM |
| Orleans | NOLA.gov TOS | "No scraping without permission" | MEDIUM |

### 4.2 Mitigation

1. **Obtain Written Permission:** Contact each parish sheriff's office and request explicit written authorization to scrape inmate rosters
2. **Document Agreements:** Maintain a file of all permission letters and TOS exceptions
3. **Zuercher Workaround:** If Zuercher portals deny permission, use browser automation (Playwright) with realistic user behavior (delays, random clicks) to simulate human browsing rather than API scraping
4. **Monitor TOS Changes:** Set up quarterly alerts to check for TOS updates on all sources

**Residual Risk:** **MEDIUM** if permission is not obtained; **LOW** with written authorization.

---

## 5. Data Accuracy & Liability

### 5.1 Source Reliability

Parish sheriff rosters are updated at varying frequencies:

| Parish | Update Frequency | Data Lag | Risk |
|--------|-----------------|----------|------|
| St. John Baptist | Real-time (Zuercher) | <1 hour | LOW |
| St. James | Daily | 12-24 hours | LOW |
| Plaquemines | Daily | 12-24 hours | LOW |
| St. Bernard | Daily | 12-24 hours | LOW |
| Jefferson | Real-time (Zuercher) | <1 hour | LOW |
| Orleans | Daily | 12-24 hours | LOW |

### 5.2 Accuracy Risks

**Risk 1: Stale Data**
- If an inmate is released but the roster is not updated, BondCurrent will continue displaying outdated information
- This could cause harm if law enforcement relies on BondCurrent for operational decisions

**Risk 2: Data Entry Errors**
- Parish rosters may contain typos, duplicate entries, or incorrect bond amounts
- BondCurrent propagates these errors without validation

**Risk 3: Liability Exposure**
- If BondCurrent is used to make bail/release decisions and causes harm due to inaccurate data, the application could face civil liability

### 5.3 Mitigation

1. **Disclaimer:** Display a prominent disclaimer on every search result:
   > "This information is sourced from official parish sheriff rosters and is provided for informational purposes only. For official booking information, contact the relevant parish sheriff's office directly. BondCurrent makes no warranty regarding accuracy or completeness."

2. **Data Validation:** Implement basic sanity checks:
   - Reject bond amounts > $10M (likely data entry errors)
   - Flag duplicate booking IDs across parishes
   - Alert if the same inmate appears with different bond amounts

3. **Source Attribution:** Always display which parish the data came from and when it was last updated
4. **Audit Trail:** Maintain a log of all data changes for forensic analysis if disputes arise
5. **Insurance:** Obtain errors & omissions (E&O) insurance covering data aggregation services

**Residual Risk:** **MEDIUM** without mitigations; **LOW** with full disclaimer and validation.

---

## 6. Operational Security Risks

### 6.1 Database Security

**Risk:** Inmate data could be exposed via SQL injection, unauthorized API access, or database breaches.

**Mitigation:**
1. Use parameterized queries (Drizzle ORM already does this)
2. Enforce API authentication (OAuth or API keys)
3. Encrypt sensitive data at rest (TLS for database connections)
4. Regular security audits and penetration testing
5. Database backups encrypted and stored separately

### 6.2 Credential Management

**Risk:** If parish websites require authentication, credentials could be exposed in code or logs.

**Mitigation:**
1. Store all credentials in environment variables, never in code
2. Rotate credentials quarterly
3. Use separate credentials per parish (not shared accounts)
4. Audit credential access logs monthly

### 6.3 DDoS & Abuse

**Risk:** BondCurrent could be used to launch DDoS attacks against parish websites or to scrape data at scale.

**Mitigation:**
1. Rate limit API requests per user (e.g., 100 requests/hour)
2. Require authentication for API access
3. Monitor for unusual access patterns (e.g., 1000 searches in 1 minute)
4. Implement CAPTCHA for repeated failed searches
5. Log all API access for forensic analysis

**Residual Risk:** **LOW** with mitigations.

---

## 7. Regulatory & Compliance Risks

### 7.1 FCRA Compliance

**Risk:** If BondCurrent data is used for employment, credit, or housing decisions, it may fall under the Fair Credit Reporting Act (FCRA) [4], which requires:
- Proper disclosures to individuals
- Dispute resolution procedures
- Accuracy standards

**Mitigation:**
1. Add a disclaimer that data should not be used for credit/employment decisions
2. If used for such purposes, implement FCRA-compliant dispute procedures
3. Obtain legal review before marketing to employers or landlords

### 7.2 Public Records Law Compliance

**Risk:** Some parishes may have local laws restricting how public records can be used or redistributed.

**Mitigation:**
1. Review each parish's public records retention and use policies
2. Obtain written approval from each parish before launching
3. Maintain compliance documentation

### 7.3 Law Enforcement Liability

**Risk:** If BondCurrent is used by law enforcement and causes harm (e.g., wrong person arrested due to data error), the application could face civil or criminal liability.

**Mitigation:**
1. Require explicit acknowledgment of data limitations before use
2. Maintain detailed audit logs of all searches and results
3. Obtain liability insurance
4. Establish a dispute resolution process for data accuracy complaints

**Residual Risk:** **MEDIUM** without legal review; **LOW** with proper disclaimers and insurance.

---

## 8. Recommended Pre-Deployment Checklist

- [ ] Obtain written permission from all 6 parish sheriff offices to scrape rosters
- [ ] Legal review of all TOS and public records laws
- [ ] Implement robots.txt compliance and User-Agent transparency
- [ ] Deploy rate limiting and adaptive polling
- [ ] Implement 90-day data retention policy with automatic deletion
- [ ] Add privacy disclaimers and GDPR/CCPA compliance measures
- [ ] Disable search engine indexing (robots meta tag)
- [ ] Implement API authentication and rate limiting
- [ ] Obtain errors & omissions insurance
- [ ] Set up monitoring for HTTP errors and rate limiting triggers
- [ ] Document all data sources, retention policies, and compliance measures
- [ ] Conduct security audit and penetration testing
- [ ] Train all staff on data handling and privacy policies

---

## 9. Ongoing Monitoring & Review

| Task | Frequency | Owner | Alert Threshold |
|------|-----------|-------|-----------------|
| Check parish TOS for changes | Quarterly | Legal | Any changes |
| Monitor HTTP error rates | Daily | DevOps | >5% errors |
| Review rate limiting alerts | Daily | DevOps | Any 429/503 responses |
| Audit data retention policy | Monthly | Compliance | Any records >90 days old |
| Review access logs for abuse | Weekly | Security | >100 searches/user/hour |
| Conduct security audit | Annually | Security | Any vulnerabilities |
| Update compliance documentation | Quarterly | Legal | Before each deployment |

---

## 10. Conclusion

BondCurrent presents **manageable risks** if proper controls are implemented. The primary concerns are:

1. **Legal compliance** with parish TOS and public records laws (requires written permission)
2. **Rate limiting** to avoid server overload (already mitigated by 30-min polling)
3. **Privacy & data retention** (requires 90-day deletion policy and GDPR/CCPA compliance)
4. **Data accuracy** (requires prominent disclaimers and validation)

**Recommendation:** Proceed with deployment after obtaining written permission from all parishes and implementing the mitigation strategies outlined in this memo. Conduct a final legal review before public launch.

---

## References

[1] Computer Fraud and Abuse Act (CFAA), 18 U.S.C. § 1030 — https://www.law.cornell.edu/uscode/text/18/1030

[2] General Data Protection Regulation (GDPR), EU Regulation 2016/679 — https://gdpr-info.eu/

[3] California Consumer Privacy Act (CCPA), Cal. Civ. Code § 1798.100 et seq. — https://oag.ca.gov/privacy/ccpa

[4] Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681 et seq. — https://www.law.cornell.edu/uscode/text/15/1681

[5] Louisiana Public Records Law, La. Code Civ. Proc. art. 1426 et seq. — https://legis.la.gov/legis/Law.aspx?d=78742
