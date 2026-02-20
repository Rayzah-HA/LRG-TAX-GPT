# Skyrim Mod Workshop

A full modding workflow for Skyrim Special Edition — Papyrus scripting, FOMOD generation, conflict analysis, and mod system design.

## Prerequisites

This command assumes you have or plan to have:
- **Skyrim Special Edition** (Steam)
- **Creation Kit** (free via Steam)
- **SKSE64** (Skyrim Script Extender) — required for most modern mods
- **Mod Organizer 2** or **Vortex** for mod management
- **xEdit/SSEEdit** for conflict detection

---

## Step 1: Determine the Mode

Ask which workflow Larry needs:

---

### Available Modes

**1. Script** — Write or debug a Papyrus script
> "I want an NPC to trigger a dialogue when the player enters a location"

**2. Design** — Plan a mod system architecture
> "I want to build a tax collection quest chain for Whiterun"

**3. FOMOD** — Generate a mod installer for Nexus distribution
> "I want users to choose between two armor variants on install"

**4. Conflict** — Analyze load order or mod conflicts
> "Two mods are both editing the same NPC — how do I fix it?"

**5. Reference** — Look up Papyrus functions, SKSE APIs, or CK concepts
> "What's the difference between OnInit and OnPlayerLoadGame?"

---

## Step 2: Route to the Right Workflow

---

### MODE: Script

Collect these details:
- **What should the script do?** (plain English description)
- **What triggers it?** (player enters area, item picked up, NPC dies, timer, etc.)
- **What script type?** (Quest, ObjectReference, Actor, MagicEffect, Perk, etc.)
- **SKSE required?** (Yes / No / Not sure)
- **Any existing script to debug or extend?**

Then launch the `papyrus-writer` subagent with all context.

The subagent will produce:
- Complete `.psc` source file, ready to compile in the Creation Kit
- Inline comments explaining each section
- Notes on SKSE dependency (if applicable)
- Compilation instructions
- Known edge cases or gotchas

Save output to `/skyrim/scripts/SCRIPT-NAME.psc`

---

### MODE: Design

Collect these details:
- **What is the mod concept?** (1-2 sentences)
- **Scale** — small tweak, medium quest, large overhaul?
- **Key systems involved** — quests, NPCs, items, locations, combat, magic, economy?
- **Target audience** — personal use, Nexus release, learning project?

Produce a **Mod Architecture Document** including:

```markdown
# Mod Design: [Name]

## Concept
[One-paragraph description]

## Systems Breakdown
- [System 1]: [what it does, scripts needed]
- [System 2]: [what it does, scripts needed]

## File Structure
[ESP name, script files, BSA assets]

## Dependencies
- Base Game: [yes/no]
- SKSE64: [yes/no — why]
- SkyUI/MCM: [yes/no — why]
- Other: [list]

## Script Map
[Each script, what it extends, what events it handles]

## Build Order
1. [First thing to build in CK]
2. [Second...]

## Risks & Gotchas
[Known conflict areas, performance concerns, etc.]
```

Save to `/skyrim/mods/MOD-NAME/design.md`

---

### MODE: FOMOD

Collect these details:
- **Mod name and version**
- **What choices does the installer offer?** (variants, patches, optional files)
- **File structure** — what files go where depending on selection?
- **Any dependency checks?** (requires USSEP, requires SkyUI, etc.)

Generate two files:

**`ModuleConfig.xml`** — FOMOD installer logic
**`Info.xml`** — Mod metadata

Explain:
- How to place these in the `fomod/` folder
- How to test in MO2 before uploading to Nexus

Save to `/skyrim/mods/MOD-NAME/fomod/`

---

### MODE: Conflict

Collect these details:
- **Which mods are conflicting?** (names + ideally ESP filenames)
- **What's the symptom?** (crash, wrong NPC stats, missing dialogue, wrong AI)
- **Load order** (paste it or describe it)

Produce:
- Plain-English explanation of what's happening
- xEdit merge patch instructions (step-by-step)
- Which mod should "win" and why
- Whether a compatibility patch exists on Nexus (check if known)

---

### MODE: Reference

Answer directly with:
- Function signature and parameters
- What it does and when to use it
- Example usage in context
- SKSE requirement (if any)
- Link to CK Wiki equivalent (if applicable)

Common references:
- Papyrus events: `OnInit`, `OnPlayerLoadGame`, `OnActivate`, `OnHit`, `OnDeath`, `OnItemAdded`
- Actor functions: `GetActorBase()`, `MoveTo()`, `SetFactionRank()`, `AddSpell()`
- Quest functions: `SetStage()`, `GetStage()`, `IsCompleted()`
- Utility: `Wait()`, `GetCurrentRealTime()`, `RandomInt()`
- SKSE: `ActorUtil`, `StringUtil`, `JsonUtil`, `PapyrusUtil`

---

## Step 3: Save All Output

All mod files go in `/skyrim/` with this structure:

```
skyrim/
  scripts/          # .psc source files
  mods/
    MOD-NAME/
      design.md     # Architecture docs
      fomod/        # FOMOD installer files
      notes.md      # Build notes, TODOs, issues
  conflicts/        # Conflict analysis notes
  reference/        # Quick reference saves
```

---

## Tone & Approach

- Treat Larry as a capable modder learning the ecosystem — not a beginner
- Be specific: actual function names, actual file paths, actual CK menu locations
- Flag SKSE dependencies clearly — some users won't have it
- When writing scripts, write production-quality code with comments
- If a mod concept is architecturally complex, recommend breaking it into phases

---

## Quick Reference: Papyrus Script Template

```papyrus
Scriptname MyMod_MyScript extends ObjectReference
; Description: [What this script does]
; Extends: [ObjectReference / Actor / Quest / etc.]
; SKSE Required: [Yes/No]

;=== Properties ===
; Drag-and-drop these in the Creation Kit
Actor Property PlayerRef Auto

;=== Events ===
Event OnActivate(ObjectReference akActionRef)
    ; Fires when this object is activated by the player or an NPC
    If akActionRef == PlayerRef
        Debug.Notification("Player activated this object")
    EndIf
EndEvent

Event OnInit()
    ; Fires once when this reference is first loaded
    ; Do NOT use for persistent setup — use OnPlayerLoadGame for saves
EndEvent

;=== Functions ===
Function DoSomething()
    ; Custom logic here
EndFunction
```
