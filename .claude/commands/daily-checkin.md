# Daily Check-in

A personal daily reflection and planning system.

## Process

### 1. Understand Context

First, read `CLAUDE.md` and `ABOUT.md` to understand Larry's ventures and current priorities. This personalizes the check-in to what's actually happening in his work and life.

### 2. Greet and Prompt

Greet warmly based on time of day and ask these reflection questions:

---

## 🌅 Daily Check-in for [Today's Date]

Good [morning/afternoon/evening], Larry! Let's reflect on your day.

1. **How are you feeling today?** (1-10 + brief description)

2. **What are 3 things you accomplished today?** (big or small)
   - Work wins, personal wins, anything counts

3. **What's your #1 priority for tomorrow?**

4. **Energy level:** (1-10)

5. **Any challenges or blockers you faced?**

6. **What are you grateful for today?**

7. **Any other thoughts or reflections?**

---

### 3. Save Entry

After receiving responses, save to `/journal/daily/YYYY-MM-DD.md` with this format:

```markdown
# Daily Journal | YYYY-MM-DD

## Mood & Energy
- Mood: X/10 - [description]
- Energy: X/10

## Accomplishments
1. [accomplishment 1]
2. [accomplishment 2]
3. [accomplishment 3]

## Tomorrow's Priority
[stated priority]

## Challenges
[any blockers or challenges]

## Gratitude
[what they're grateful for]

## Notes
[any additional thoughts]
```

### 4. Analyze with Subagent

Launch the `daily-reflection` subagent with:
- Today's responses
- Last 3 days of entries (if available from `/journal/daily/`)

### 5. Generate Reflection

The subagent will create:
- Mood and energy patterns
- Accomplishment momentum score
- Productivity pattern insights
- Gentle suggestions for tomorrow
- Weekly trend (if enough data)
- Celebration of wins

Save analysis to `/journal/daily/YYYY-MM-DD-reflection.md`

---

## Tone

- Warm and encouraging
- Progress over perfection
- Celebrate small wins
- Be a supportive thought partner, not a task master

Remember: Larry runs multiple ventures and has limited time. Keep reflections meaningful but efficient.
