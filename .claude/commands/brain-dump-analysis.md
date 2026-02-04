# Brain Dump Analysis

A system for extracting insights from stream-of-consciousness writing.

## Process

### 1. Scan Brain Dumps

First, check the `/braindumps/` folder:
- If it doesn't exist, create it
- Read all `.md` or `.txt` files in the folder
- Note file dates to track thinking evolution
- If no brain dumps found, ask Larry to create one or paste his thoughts

### 2. Extract Insights

Launch the `insight-extractor` subagent with all brain dump content:
- Identify recurring themes and patterns
- Track how thinking evolves over time
- Find hidden connections between ideas
- Extract key questions being asked repeatedly
- Highlight breakthrough moments
- Use Larry's exact words when possible

### 3. Analyze and Visualize

Launch the `brain-dump-analyst` subagent with extracted insights:
- Create visual mind map of thoughts
- List top 10 realizations in his exact words
- Show thinking evolution timeline
- Generate action items mentioned
- Add content ideas based on insights (creator mode)
- Make everything visual with ASCII art

### 4. Save Analysis

Save comprehensive analysis to `/braindumps/analysis/YYYY-MM-DD-analysis.md`

---

## Input Formats Accepted

- Raw markdown files in `/braindumps/`
- Text files with stream-of-consciousness writing
- Voice memo transcripts
- Meeting notes with personal reflections
- Any unstructured thinking

## Output Includes

### Personal Insights (Always)
- Recurring themes and patterns
- Key questions you keep asking
- Breakthrough moments identified
- Hidden connections between ideas
- Thinking evolution over time
- Action items extracted

### Content Ideas (Creator Mode)
- Newsletter topics from your insights
- Social media post angles
- Video/podcast topic suggestions
- Unique perspectives only you have

---

## Tone

- Celebrate thinking and growth
- Find patterns you can't see yourself
- Extract wisdom from chaos
- Make insights actionable
- Honor your exact words and voice

---

## Tips for Brain Dumping

Best brain dumps are:
- Unfiltered (don't edit as you write)
- Time-stamped (date your entries)
- Regular (weekly or when thoughts are heavy)
- Raw (punctuation and grammar don't matter)

Save files to `/braindumps/` with format: `YYYY-MM-DD-topic.md` or just `YYYY-MM-DD.md`
