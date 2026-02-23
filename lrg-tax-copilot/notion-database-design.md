# LRG Tax Services — Notion Database Design

## Internal Tax Practice Intelligence System

**Purpose:** Scope memory, pricing intelligence, and complexity tracking for a solo tax practice.
**Not for:** Client-facing use. Does not duplicate TaxDome (documents, invoices, workflow).
**Revenue target:** $100K annual — every field earns its place or gets cut.

---

## Database 1: Same As Last Year (SALY)

> One row = one client. Carries forward year over year. This is your institutional memory — what the return looked like, what it cost, and what to expect next time.

### Properties

| Property | Type | Options / Notes |
|---|---|---|
| **Client Name** | Title | Primary identifier. Match spelling to TaxDome exactly. |
| **Current Scope** | Multi-select | `W-2` · `Schedule C` · `Rental` · `Investments` · `S-Corp` · `Partnership` · `C-Corp` · `Nonprofit` |
| **Rental Count** | Number | Integer. Number of Schedule E properties. 0 if none. |
| **Investment Level** | Select | `None` · `Summary Only` · `Multiple Statements` · `Active Trader` |
| **Depreciation Active** | Checkbox | ✓ if any asset is on a depreciation schedule (personal or pass-through). |
| **Passive Loss Carryover** | Checkbox | ✓ if suspended passive losses carry into next year. Flags returns that need continuity. |
| **Entity Returns Required** | Multi-select | `1120S` · `1065` · `1120` · `990` — Which entity forms this client triggers. Empty = individual only. |
| **Complexity Tier** | Select | See tier definitions below. |
| **Most Recent Fee** | Number | Dollar amount. What the client actually paid last season (total across all returns). |
| **Operational Risk Flag** | Checkbox | ✓ if client has history of: late documents, missing info, scope creep, payment issues, or unreasonable expectations. |
| **Linked Entities** | Relation | → Entity Command Center (one client → many entities). |
| **Entity Count** | Rollup | Count of related entities. Auto-calculated from relation. |
| **Total Entity Fees** | Rollup | Sum of "Most Recent Entity Fee" from related entities. |
| **Notes** | Rich Text | Free-form internal notes. Prior-year quirks, preparer reminders, special circumstances. Keep it short. |
| **Last Updated** | Date | When this record was last reviewed. Set manually at end of each season. |

### Complexity Tier Definitions

| Tier | Label | Description | Typical Fee Range |
|---|---|---|---|
| **Tier 1** | Basic Individual | W-2 income, standard deduction or simple itemized. No business, no rental, no investments beyond basics. | $260 |
| **Tier 2** | Rental / Investment | Individual + rental properties OR investment activity (Schedule D, K-1 income). Depreciation likely. | $350–$500 |
| **Tier 3** | Schedule C | Sole proprietorship or SMLLC with business income. May include home office, vehicle, depreciation. | $400–$800 |
| **Tier 4** | Entity Return | Client triggers at least one entity return (1120S, 1065, 1120, 990) in addition to personal. | $1,200+ per entity |
| **Tier 5** | Multi-Entity | Client owns or controls 2+ entities. Multiple entity returns plus personal. Highest complexity and coordination. | $2,500+ combined |

### Tier Assignment Logic

```
IF Entity Returns Required has 2+ selections → Tier 5
ELSE IF Entity Returns Required has 1 selection → Tier 4
ELSE IF Current Scope contains "Schedule C"  → Tier 3
ELSE IF Current Scope contains "Rental" OR "Investments" → Tier 2
ELSE → Tier 1
```

> You can automate this with a Notion formula or just set it manually. Manual is fine at <200 clients.

---

## Database 2: Entity Command Center

> One row = one business entity. Every S-Corp, partnership, C-Corp, nonprofit, and SMLLC gets its own row. Linked back to the owner in SALY.

### Properties

| Property | Type | Options / Notes |
|---|---|---|
| **Entity Name** | Title | Legal entity name as filed. |
| **Owner** | Relation | → Same As Last Year. The individual client who owns/controls this entity. |
| **Entity Type** | Select | `S-Corp` · `Partnership` · `C-Corp` · `Nonprofit` · `SMLLC` |
| **EIN** | Rich Text | Employer Identification Number. Keep here for quick reference (TaxDome has it too, but this saves a click). |
| **Bookkeeping Status** | Select | `Clean Books` · `Needs Adjustments` · `Client Spreadsheet` · `Bank Statements Only` · `Unknown` |
| **Payroll Required** | Checkbox | ✓ if entity has payroll (W-2 employees or officer compensation). Critical for S-Corp compliance. |
| **Depreciation Schedule Active** | Checkbox | ✓ if entity has assets on depreciation. Flags returns needing Form 4562. |
| **Number of Owners** | Number | Integer. Affects K-1 count and filing complexity. |
| **Most Recent Entity Fee** | Number | Dollar amount. What was charged for this specific entity return last season. |
| **Filing Complexity** | Select | See tier definitions below. |
| **Fiscal Year End** | Select | `12/31 (Calendar)` · `Other` — Most are calendar year. Flag exceptions. |
| **Operational Risk Flag** | Checkbox | ✓ if entity has: messy books, late financials, payroll issues, or multi-state filing. |
| **Notes** | Rich Text | Entity-specific preparer notes. K-1 distribution quirks, basis issues, officer comp history. |
| **Last Updated** | Date | When this record was last reviewed. |

### Filing Complexity Tier Definitions

| Tier | Label | Description | Typical Fee |
|---|---|---|---|
| **Tier 1** | Clean SMLLC | Single-member LLC reported on Schedule C. Clean books, simple operations. | $400–$600 |
| **Tier 2** | Basic S-Corp | Single-owner S-Corp with clean books and standard officer compensation. | $1,200 |
| **Tier 3** | Multi-owner / Payroll | Partnership or S-Corp with multiple owners, payroll, or complex allocations. | $1,200–$1,500 |
| **Tier 4** | Multi-Entity Structure | Entity is part of a larger structure (parent/sub, related entities, tiered partnerships). | $1,500+ |

---

## Relation Architecture

```
┌──────────────────────┐         ┌──────────────────────────┐
│   Same As Last Year  │         │  Entity Command Center   │
│   (SALY)             │         │                          │
│                      │  1 → N  │                          │
│  Client Name ────────┼────────→│  Owner (Relation)        │
│                      │         │                          │
│  Linked Entities ←───┼─────────┤  Entity Name             │
│  Entity Count (Rollup)│        │  Most Recent Entity Fee  │
│  Total Entity Fees   │         │                          │
│  (Rollup)            │         │                          │
└──────────────────────┘         └──────────────────────────┘
```

**Relation:** SALY.`Linked Entities` ↔ Entity Command Center.`Owner`
- One client can own many entities.
- One entity has one primary owner (the client who engages you for that return).

**Rollups on SALY:**
- `Entity Count` → Count of related rows in Entity Command Center.
- `Total Entity Fees` → Sum of `Most Recent Entity Fee` from related entities.

---

## Recommended Views

### Same As Last Year — Views

| View Name | Type | Filter / Sort | Purpose |
|---|---|---|---|
| **All Clients** | Table | Sort by Client Name A→Z | Default master list. |
| **High Revenue Clients** | Table | Most Recent Fee ≥ $800, sort by fee descending | Protect your best revenue. These clients get priority scheduling and white-glove service. |
| **Rental Clients** | Table | Current Scope contains "Rental" | Quick access during rental season. Sort by Rental Count descending to see complex ones first. |
| **Investment Clients** | Table | Investment Level ≠ "None" | Identify clients needing brokerage review. Filter further by "Active Trader" for high-touch. |
| **Multi-Entity Clients** | Table | Complexity Tier = "Tier 5" | Your most complex (and highest-fee) clients. Review these first for scheduling. |
| **Entity Clients** | Table | Entity Returns Required is not empty | Everyone who triggers a business return. Use for entity-season planning. |
| **Risk Clients** | Table | Operational Risk Flag = ✓ | Late docs, scope creep, payment problems. Review before engaging for new season. Consider fee increases or disengagement. |
| **Needs Review** | Table | Last Updated is before Jan 1 of current year | Stale records. Use this at start of each season to refresh your data. |
| **Revenue Board** | Board | Group by Complexity Tier, show Most Recent Fee | Visual revenue distribution across tiers. Identify where your revenue concentrates. |

### Entity Command Center — Views

| View Name | Type | Filter / Sort | Purpose |
|---|---|---|---|
| **All Entities** | Table | Sort by Entity Name A→Z | Master list. |
| **By Entity Type** | Board | Group by Entity Type | Visual breakdown of your entity mix. |
| **Messy Books** | Table | Bookkeeping Status ≠ "Clean Books" | Entities that will need extra time. Plan accordingly or quote higher. |
| **Payroll Entities** | Table | Payroll Required = ✓ | Quick list for payroll compliance checks (officer comp, W-2/W-3 filing). |
| **S-Corp Dashboard** | Table | Entity Type = "S-Corp" | Focused view for your most common entity type. |
| **Risk Entities** | Table | Operational Risk Flag = ✓ | Problem entities. Cross-reference with owner's risk flag in SALY. |
| **Fee Review** | Table | Sort by Most Recent Entity Fee descending | See entity revenue at a glance. Identify underpriced entities. |
| **Multi-Owner** | Table | Number of Owners ≥ 2 | Partnerships and multi-owner S-Corps. These need more K-1 time. |

---

## Post-Season Maintenance Protocol

### When: After April 15 (or after extension deadline, October 15)

Run this checklist once per season. Takes 1–2 hours for a solo practice under 100 clients.

#### Step 1: Update Every Client Record (SALY)

For each client you filed this season:

- [ ] **Current Scope** — Did anything change? New rental? Started a business? Sold investments?
- [ ] **Rental Count** — Accurate? Did they buy or sell properties?
- [ ] **Investment Level** — Upgrade or downgrade based on what you actually saw.
- [ ] **Depreciation Active** — Any new assets placed in service? Any fully depreciated?
- [ ] **Passive Loss Carryover** — Check Schedule E / Form 8582. Carrying losses forward?
- [ ] **Entity Returns Required** — Add or remove entity forms as needed.
- [ ] **Complexity Tier** — Recalculate using the tier logic. Move up or down as scope changed.
- [ ] **Most Recent Fee** — Enter what you actually charged (total across all returns for this client).
- [ ] **Operational Risk Flag** — Set or clear based on this season's experience.
- [ ] **Notes** — Any preparer reminders for next year? ("Client always forgets K-1 from XYZ fund", "Needs extension every year", etc.)
- [ ] **Last Updated** — Set to today's date.

#### Step 2: Update Every Entity Record

For each entity return you filed:

- [ ] **Bookkeeping Status** — Was it clean this year? Downgrade if books were messy.
- [ ] **Payroll Required** — Still accurate?
- [ ] **Depreciation Schedule Active** — New assets? Dispositions?
- [ ] **Number of Owners** — Changed?
- [ ] **Most Recent Entity Fee** — What you actually charged for this entity return.
- [ ] **Filing Complexity** — Adjust tier if complexity changed.
- [ ] **Operational Risk Flag** — Set or clear.
- [ ] **Notes** — Entity-specific reminders.
- [ ] **Last Updated** — Set to today's date.

#### Step 3: Revenue Analysis (15 minutes)

Open the **Revenue Board** view in SALY and check:

1. **Revenue by tier** — Where is your money coming from?
   - If 70%+ of revenue is Tier 1–2, you're undercharging or need more entity clients.
   - If Tier 4–5 dominates, you're well-positioned but watch capacity.

2. **Average fee per tier** — Are you hitting your 2026 pricing targets?
   | Tier | Target Average |
   |---|---|
   | Tier 1 | $260 |
   | Tier 2 | $400 |
   | Tier 3 | $550 |
   | Tier 4 | $1,500 |
   | Tier 5 | $3,000+ |

3. **Risk client revenue** — How much revenue is tied to risk-flagged clients? If >15%, address it.

#### Step 4: Pre-Season Prep (November–December)

- [ ] Open the **Needs Review** view — update any stale records.
- [ ] Open **Risk Clients** — decide: raise fees, set boundaries, or disengage.
- [ ] Open **High Revenue Clients** — send early engagement letters to lock them in.
- [ ] Open **Multi-Entity Clients** — schedule early to avoid bottlenecks.
- [ ] Review **Messy Books** entities — send bookkeeping prep instructions early.

---

## Scaling Notes

**At <50 clients:** Manual updates are fine. Do it all in one sitting after season.

**At 50–100 clients:** Block a half-day. Consider batch-updating by tier (all Tier 1 first, then Tier 2, etc.).

**At 100+ clients:** Add a `Status` select property (`Active` / `Inactive` / `Prospect`) to both databases. Start filtering views by status. Consider a seasonal intake form that auto-populates scope fields.

**Revenue math at $100K target:**
| Mix | Count | Avg Fee | Revenue |
|---|---|---|---|
| Tier 1–2 Individuals | 120 | $300 | $36,000 |
| Tier 3 Schedule C | 40 | $550 | $22,000 |
| Tier 4 Entity Clients | 20 | $1,500 | $30,000 |
| Tier 5 Multi-Entity | 4 | $3,000 | $12,000 |
| **Total** | **184 returns** | | **$100,000** |

This is one realistic path. Adjust the mix based on where you want to grow — entity work pays more per hour but has higher complexity. Schedule C volume is the middle ground.

---

## Integration with LRG Tax Copilot

These databases can be connected to the copilot once Notion integration is live:

- **MODE-PLS (Pricing):** Pull client's `Complexity Tier` and `Most Recent Fee` to inform pricing conversations.
- **Client Intelligence:** Cross-reference `Current Scope` and `Entity Returns Required` with the copilot's auto-extracted client context.
- **MODE-CRD (Drafting):** Use `Operational Risk Flag` to adjust communication tone (more formal for risk clients).
- **Entity lookup:** When a preparer mentions a business name, pull the entity's `Bookkeeping Status` and `Filing Complexity` for context.

Connect via the existing Notion API integration in `backend/src/services/notionRetrieval.ts` using the database IDs for these two new databases.
