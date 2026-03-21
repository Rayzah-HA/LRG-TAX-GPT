# CLAUDE.md

## About This Project

This is Larry Graham's personal command center for tracking progress across multiple ventures.

---

## Who Is Larry Graham

**Roles**: Cybersecurity Engineer | Tax Strategist | Media & Travel Creator

A senior cybersecurity professional by day, running multiple ventures that blend strategy, storytelling, and execution:

- **LRG Tax Services** ([lrgtaxservice.com](https://lrgtaxservice.com)) - Tax preparation and planning for individuals and businesses
- **LRG Media** ([lrgmedia.io](https://lrgmedia.io)) - Real estate, drone, and commercial photography
- **Travel Graham** ([travelgraham.net](https://travelgraham.net)) - Travel experiences, photography, and destination content

---

## Interests & Focus Areas

- Cybersecurity, cloud infrastructure, and systems design
- Personal finance, tax strategy, and credit optimization
- Travel, photography, and cinematic storytelling
- Building brands, workflows, and scalable side businesses
- World-building, character creation, and narrative design
- Smart homes (Home Assistant on Docker), home labs, and tech that actually works

---

## Weekly Check-In Protocol

The `/weekly-checkin` command provides an intelligent weekly review:

### What It Does

1. **Analyzes project context** - Reads ABOUT.md, CLAUDE.md, and metrics history
2. **Discovers relevant metrics** - Determines what to track based on current ventures and season
3. **Asks for current values** - Requests specific metrics relevant to this week's focus
4. **Generates visual analysis** - Creates week-over-week comparisons with trends
5. **Saves formatted report** - Stores insights in `/metrics/weekly-report-YYYY-MM-DD.md`

### Seasonal Awareness

- **Tax Season (Jan-Apr)**: Emphasizes LRG Tax Services metrics
- **Summer/Travel Season**: Emphasizes Travel Graham content metrics
- **Year-round**: Balances all ventures based on active projects

### Output Includes

- Venture health dashboard
- Week-over-week metric comparisons
- Growth indicators and progress bars
- Cross-venture synergy opportunities
- 3-5 prioritized action items

---

## Daily Brief Protocol

The `/daily-brief` command provides a personalized morning news briefing:

**Use at START of day.** (Use `/daily-checkin` at END of day.)

### What It Does

1. **Analyzes your interests** - Scans ABOUT.md, CLAUDE.md, brain dumps, journal
2. **Searches recent news** - Uses web search for stories from LAST 7 DAYS ONLY
3. **Curates and contextualizes** - Filters for relevance, explains why each matters
4. **Delivers brief** - 5-10 stories organized by category

### Categories Covered

- Cybersecurity & Tech (career)
- Tax & Finance (LRG Tax Services)
- Travel & Content (Travel Graham)
- Personal interests (as relevant)

### Quality Standards

- Only news from last 7 days
- Publication dates on all stories
- Connection to YOUR specific interests
- Actionable when possible

---

## Daily Check-In Protocol

The `/daily-checkin` command provides personal reflection and planning:

### What It Does

1. **Greets you warmly** - Based on time of day
2. **Asks reflection questions** - Mood, accomplishments, priorities, energy, gratitude
3. **Saves journal entry** - Stores in `/journal/daily/YYYY-MM-DD.md`
4. **Analyzes patterns** - Mood trends, energy levels, accomplishment momentum
5. **Generates insights** - Saved to `/journal/daily/YYYY-MM-DD-reflection.md`

### Tracks Over Time

- Mood and energy patterns
- Accomplishment streaks
- Burnout warning signs
- Gratitude themes
- Weekly rollups when enough data exists

---

## Newsletter Research Protocol

The `/newsletter-research` command creates authentic, value-first newsletter content:

### What It Does

1. **Gathers sources** - Reads URLs from `/newsletter/sources.md` or asks for them
2. **Learns your voice** - Analyzes your existing content for tone and style
3. **Researches competitors** - Launches content-researcher subagent to find trends
4. **Writes the draft** - Launches newsletter-writer subagent to create content
5. **Saves outputs** - Research to `/newsletter/research/`, drafts to `/newsletter/drafts/`

### Output Includes

- 3 compelling subject line options
- Complete 500-800 word draft in your voice
- Practical takeaways
- Soft CTA if relevant
- Research findings and competitor analysis

### Quality Standards

- Sounds like you, not AI
- Leads with value, not promotion
- One clear actionable takeaway
- Scannable format (headers, bullets, short paragraphs)
- Creates curiosity without clickbait

---

## Brain Dump Analysis Protocol

The `/brain-dump-analysis` command extracts insights from stream-of-consciousness writing:

### What It Does

1. **Scans brain dumps** - Reads all files from `/braindumps/`
2. **Extracts insights** - Launches insight-extractor subagent to find patterns
3. **Analyzes and visualizes** - Launches brain-dump-analyst for visual output
4. **Saves analysis** - Stores in `/braindumps/analysis/YYYY-MM-DD-analysis.md`

### Output Includes

- Visual mind map of thoughts
- Top 10 realizations in your exact words
- Thinking evolution timeline
- Hidden connections between ideas
- Action items extracted
- Content ideas from your insights

### How to Use

Save raw thoughts to `/braindumps/` as `.md` files. Format: `YYYY-MM-DD.md` or `YYYY-MM-DD-topic.md`

---

## Directory Structure

```
.claude/
  commands/
    daily-brief.md          # Morning news briefing
    daily-checkin.md        # Evening personal reflection
    weekly-checkin.md       # Weekly business metrics check-in
    newsletter-research.md  # Newsletter research and writing
    brain-dump-analysis.md  # Brain dump insight extraction
  subagents/
    interest-analyzer.md    # Identifies interests for news
    news-curator.md         # Curates recent relevant news
    metrics-analyst.md      # Analyzes weekly metrics
    daily-reflection.md     # Analyzes daily journal entries
    content-researcher.md   # Researches newsletter trends
    newsletter-writer.md    # Writes newsletter drafts
    insight-extractor.md    # Extracts patterns from brain dumps
    brain-dump-analyst.md   # Visualizes brain dump insights
metrics/
  metrics-history.md        # Historical metrics data
  weekly-report-*.md        # Generated weekly reports
journal/
  daily/
    YYYY-MM-DD.md               # Daily journal entries
    YYYY-MM-DD-reflection.md    # Daily analysis
newsletter/
  sources.md                # Newsletter URLs for research
  research/                 # Research findings
  drafts/                   # Newsletter drafts
braindumps/
  YYYY-MM-DD.md             # Raw brain dump files
  analysis/                 # Generated analyses
home-assistant/
  config/                   # HA configuration templates
    configuration.yaml      # Main config
    automations.yaml        # Automation definitions
    scripts.yaml            # Script definitions
    scenes.yaml             # Scene definitions
    secrets.yaml.example    # Secrets template (actual secrets git-ignored)
  automations/              # Automation planning docs
  dashboards/               # Dashboard planning docs
  docs/                     # Setup guides and device inventory
  backups/                  # HA backups (git-ignored)
ABOUT.md                    # Personal bio and links
CLAUDE.md                   # This file - project context
```

---

## Goals & Current Focus

<!-- Update this section with current priorities -->

### Q1 2026 Focus
- [ ] Tax season preparation and client outreach
- [ ] Build consistent Travel Graham content pipeline
- [ ] Expand LRG Media portfolio with new property shoots

### Long-term Vision
- Scale tax practice with efficient systems
- Grow Travel Graham to sustainable content brand
- Position LRG Media as go-to for real estate photography

---

## Notes for Claude

When working with Larry:
- He values depth, mastery, and systems thinking
- Prefers strategic, actionable advice over generic tips
- Appreciates clean, visual formats for data
- Runs multiple ventures - be mindful of context switching
- Time is limited - prioritize high-impact actions
