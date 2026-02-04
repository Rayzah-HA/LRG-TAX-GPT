# Daily Brief

A personalized morning news briefing based on your interests and ventures.

**Use this at the START of your day.** (Use `/daily-checkin` at the END of your day.)

## Process

### 1. Analyze Interests

Launch the `interest-analyzer` subagent to scan:
- `ABOUT.md` for ventures and focus areas
- `CLAUDE.md` for current goals and priorities
- `braindumps/` for recent thoughts and concerns
- `journal/daily/` for recent reflections

Build an interest profile covering:
- Professional interests (cybersecurity, tax, media, travel content)
- Business interests (LRG Tax, LRG Media, Travel Graham)
- Personal interests (gaming, home lab, smart home, photography)
- Current priorities (from brain dumps and journal)

### 2. Search for News

Launch the `news-curator` subagent with the interest profile.

**CRITICAL REQUIREMENTS:**
- Use WebSearch tool for ALL news gathering
- Filter to LAST 7 DAYS ONLY
- Include publication date on EVERY story
- Verify dates before including any story
- NO made-up or outdated news

### 3. Curate and Contextualize

For each relevant story, provide:
- **Headline** with source and date
- **Why it matters to you** (connect to specific interest)
- **Potential action** (optional, only if relevant)

### 4. Format the Brief

Structure the output as:

```markdown
# Daily Brief | YYYY-MM-DD

Good morning, Larry. Here's what matters today.

## 🔒 Cybersecurity & Tech
[Relevant stories with dates and context]

## 💰 Tax & Finance
[Relevant stories with dates and context]

## ✈️ Travel & Content
[Relevant stories with dates and context]

## 🎯 Action Items
[Optional: things you might want to do based on news]

## 📅 Your Day
[Quick reminder of priorities from recent brain dumps/journal]
```

---

## Interest Categories

Based on Larry's profile:

**Professional**
- Cybersecurity news, vulnerabilities, trends
- Cloud infrastructure updates
- AI and automation developments

**LRG Tax Services**
- Tax law changes and updates
- IRS announcements
- Filing deadlines and extensions
- Industry news

**LRG Media**
- Real estate market trends
- Drone regulations
- Photography/video tech

**Travel Graham**
- Travel industry news
- Destination updates
- Content creator trends

**Personal**
- Gaming news (if relevant)
- Smart home tech
- Homelab/NAS developments

---

## Quality Standards

- **Recency**: Only news from last 7 days
- **Relevance**: Must connect to identified interests
- **Verification**: All dates must be accurate
- **Actionability**: Prioritize news you can act on
- **Brevity**: 5-10 stories max, not a firehose

---

## Timing

Best used:
- First thing in the morning
- Before starting work
- Takes ~2-3 minutes to read

Pair with `/daily-checkin` at end of day for full daily ritual.
