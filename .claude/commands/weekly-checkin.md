# Weekly Check-in

Perform a comprehensive weekly check-in by:

## 1. Analyze Project Context

First, understand who you're working with:

- Read `ABOUT.md` to understand Larry Graham's profile and ventures
- Read `CLAUDE.md` for project context and goals
- Scan any existing `metrics/` folder for historical data
- Review any `docs/`, `business/`, or project folders for additional context

## 2. Discover Relevant Metrics

Based on Larry's multi-venture profile, determine which metrics to track across:

**LRG Tax Services (Tax Practice)**
- New clients acquired
- Returns prepared/filed
- Revenue this week
- Consultations scheduled
- Client retention rate

**LRG Media (Photography/Media)**
- Shoots completed
- New bookings
- Revenue from projects
- Portfolio additions
- Client inquiries

**Travel Graham (Travel Content)**
- Instagram followers
- Content pieces published
- Engagement rate
- Website traffic
- Brand partnerships/collaborations

**Cybersecurity Career**
- Certifications progress
- Projects completed
- Skills developed
- Professional networking

## 3. Gather Current Metrics

Ask for current values of the metrics most relevant to THIS week's focus. Don't overwhelm with all metrics every week—prioritize based on:
- Active projects
- Seasonal relevance (tax season vs off-season)
- Current goals mentioned in CLAUDE.md

## 4. Process and Analyze

After receiving data:

1. Read previous week's data from `/metrics/metrics-history.md` if it exists
2. Update metrics history with new entries
3. Launch the `metrics-analyst` subagent for detailed analysis
4. Generate a report saved to `/metrics/weekly-report-YYYY-MM-DD.md`

## 5. Output Format

Provide:
- Quick wins and celebrations from the week
- Areas needing attention
- 3-5 actionable priorities for next week
- Visual progress indicators where applicable

---

**IMPORTANT**: Adapt questions based on context. During tax season (Jan-Apr), emphasize tax metrics. During travel season, emphasize content metrics. Always stay relevant to what Larry is actively working on.
