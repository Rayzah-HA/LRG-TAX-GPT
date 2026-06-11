# Athletic Rebuild HQ

A personal iPhone app for rebuilding conditioning, physique, mobility, and
confidence — workout tracking, body progress, suit fit, nutrition, and recovery,
all in one local-first SwiftUI app.

> Built for a former athlete rebuilding while working overseas. Dark-mode-first,
> big tap targets, minimal typing in the gym.

## Tech

- **SwiftUI** (iOS 17+)
- **SwiftData** for local-first persistence (no account, no cloud required)
- **Swift Charts** for the weight trend
- **PhotosUI + UIImagePickerController** for attaching photos from the library or camera
- MVVM-lite: SwiftData `@Model` types + `@Query`-driven views, organized by feature folder

## Open it

1. Open `AthleticRebuildHQ.xcodeproj` in Xcode 16 or later.
2. Select an iOS 17+ simulator (or your iPhone).
3. Build & Run (⌘R).

The project uses Xcode's file-system–synchronized groups, so every Swift file in
the `AthleticRebuildHQ/` source folder is included automatically — no manual
target membership needed.

> Camera capture requires a real device; on the Simulator the camera button
> falls back to the photo library.

## Features

| Tab | What it does |
| --- | --- |
| **Home** | Dashboard: today's workout, weekly workout count, current weight + trend, cardio minutes this week, recovery score, last progress photo, suit-fit reminder, quick links |
| **Workouts** | Log sessions (type, duration, energy 1–10, notes, exercise checklist, cardio/stretching). Start from a template. Access the 4 templates. |
| **Library** | Gallery of exercises with photos, muscle-group filters, search. Each exercise has sets/reps, starting & current weight, form cue, notes, photo, optional demo video link. Quick ±5 weight buttons. |
| **Body** | Weight trend chart + measurement history (weight, waist, chest, arms, thighs), sleep/stress/energy scores, and front/side/back progress photos. Links to Suit Fit. |
| **Recovery** | Daily recovery score (sleep, soreness, stress, motivation, hydration, mobility). Links to Nutrition. |

Secondary screens — **Templates**, **Suit Fit**, **Nutrition** — are reachable
from the dashboard quick links and the relevant tab toolbars.

## Seeded content

On first launch the app seeds:

- **26 exercises** (Lat Pulldown, Chest Press, Seated Row, … Toe Touches) with form cues.
- **4 workout templates**: Upper Machine Day, Lower Machine Day, Lower Athletic Day, Upper Dumbbell + Machine Day.

## Project structure

```
AthleticRebuildHQ/
  App/            App entry, tab navigation
  Models/         SwiftData @Model types + enums
  Shared/         Theme, helpers, reusable components (cards, photo field, sliders)
  Features/
    Dashboard/  ExerciseLibrary/  Templates/  Workouts/
    BodyProgress/  SuitFit/  Nutrition/  Recovery/
  Resources/      Seed data + preview sample data
  Assets.xcassets
```
