# Newsletter Research

A system for analyzing competitor newsletters, identifying trends, and writing authentic drafts.

## Process

### 1. Gather Sources

First, check for newsletter URLs:
- Look for `/newsletter/sources.md` or similar file with URLs
- Check `CLAUDE.md` for any newsletter links
- If no sources found, ask Larry for:
  - His newsletter URL (to learn his voice)
  - 2-3 competitor newsletter URLs

### 2. Analyze Larry's Voice

Before researching competitors, read Larry's existing content:
- Previous newsletter drafts in `/newsletter/drafts/`
- `ABOUT.md` for tone and positioning
- `CLAUDE.md` for context and focus areas

Note his voice characteristics:
- Direct and strategic, not fluffy
- Values depth and mastery
- Practical takeaways over theory
- Clean, scannable formatting
- Authentic, not salesy

### 3. Research Competitors

Launch the `content-researcher` subagent with:
- Competitor newsletter URLs
- Larry's current ventures and focus areas
- Seasonal context (tax season, travel season, etc.)

The subagent will:
- Fetch recent posts from competitor newsletters
- Identify trending topics across sources
- Find content gaps and opportunities
- Spot time-sensitive angles
- Return structured insights

### 4. Write the Draft

Launch the `newsletter-writer` subagent with:
- Research insights from content-researcher
- Larry's voice profile
- Current focus areas from `CLAUDE.md`

The subagent will create:
- 3 compelling subject line options
- Complete 500-800 word draft
- Practical takeaways
- Soft CTA if relevant

### 5. Save Outputs

Save to organized folders:
- `/newsletter/research/YYYY-MM-DD-research.md` - Research findings
- `/newsletter/drafts/YYYY-MM-DD-draft.md` - Newsletter draft

---

## Newsletter Topics by Venture

**LRG Tax Services** (Jan-Apr priority)
- Tax tips and deadlines
- Common mistakes to avoid
- Strategy for specific situations
- Changes in tax law

**Travel Graham**
- Destination insights
- Travel hacks and tips
- Photography/content creation tips
- Upcoming trip teasers

**LRG Media**
- Real estate photography tips
- Drone content trends
- Behind-the-scenes insights
- Portfolio highlights

**Cross-Venture**
- Entrepreneurship insights
- Balancing multiple ventures
- Systems and productivity
- Tech and tools that work

---

## Quality Standards

The newsletter should:
- Sound like Larry, not AI
- Lead with value, not promotion
- Include one actionable takeaway
- Be scannable (headers, bullets, short paragraphs)
- Create curiosity without clickbait
- Feel like advice from a knowledgeable friend

---

## Output Format

Present to Larry:
1. Quick summary of research findings
2. 3 subject line options with reasoning
3. Complete draft ready for review
4. Suggested send timing if relevant
