import Foundation
import SwiftData

/// Seeds the SwiftData store with Larry's starter exercise library and the
/// four workout templates on first launch. Idempotent: it only runs when the
/// store has no exercises yet.
enum SeedData {

    static func seedIfNeeded(_ context: ModelContext) {
        let exerciseCount = (try? context.fetchCount(FetchDescriptor<Exercise>())) ?? 0
        guard exerciseCount == 0 else { return }

        let exercises = seedExercises()
        for exercise in exercises {
            context.insert(exercise)
        }
        for template in seedTemplates() {
            context.insert(template)
        }
        try? context.save()
    }

    // MARK: - Exercises

    static func seedExercises() -> [Exercise] {
        [
            Exercise(name: "Lat Pulldown", muscleGroup: .back, equipment: "Cable Machine",
                     formCue: "Pull to upper chest, drive elbows down, squeeze lats."),
            Exercise(name: "Chest Press", muscleGroup: .chest, equipment: "Machine",
                     formCue: "Keep shoulders down, press without locking elbows hard."),
            Exercise(name: "Seated Row", muscleGroup: .back, equipment: "Cable Machine",
                     formCue: "Chest up, pull to navel, squeeze shoulder blades."),
            Exercise(name: "Tricep Extension", muscleGroup: .arms, equipment: "Cable/Machine",
                     formCue: "Pin elbows, full lockout, control the return."),
            Exercise(name: "Bicep Curl", muscleGroup: .arms, equipment: "Dumbbell/Machine",
                     formCue: "No swing, squeeze at top, lower slowly."),
            Exercise(name: "Leg Extension", muscleGroup: .legs, equipment: "Machine",
                     formCue: "Pause at top, don't slam the weight down."),
            Exercise(name: "Leg Curl", muscleGroup: .legs, equipment: "Machine",
                     formCue: "Curl fully, control eccentric, keep hips planted."),
            Exercise(name: "Leg Press", muscleGroup: .legs, equipment: "Machine",
                     formCue: "Feet shoulder-width, don't lock knees, full depth."),
            Exercise(name: "Hip Adductor", muscleGroup: .legs, equipment: "Machine",
                     formCue: "Slow squeeze inward, controlled release."),
            Exercise(name: "Hip Abductor", muscleGroup: .glutes, equipment: "Machine",
                     formCue: "Push knees out, pause, resist the return."),
            Exercise(name: "Standing Calf Raises", muscleGroup: .legs, equipment: "Machine/Bodyweight",
                     reps: 20, formCue: "Full stretch at bottom, big squeeze at top."),
            Exercise(name: "Romanian Deadlift", muscleGroup: .legs, equipment: "Dumbbell/Barbell",
                     reps: 15, formCue: "Hinge at hips, flat back, feel the hamstrings."),
            Exercise(name: "Deep Squat", muscleGroup: .legs, equipment: "Dumbbell/Bodyweight",
                     reps: 15, formCue: "Chest up, knees track toes, full depth."),
            Exercise(name: "Alternating Reverse Lunges", muscleGroup: .legs, equipment: "Dumbbell/Bodyweight",
                     reps: 15, formCue: "Step back, drop straight down, push through front heel."),
            Exercise(name: "Elbow Plank", muscleGroup: .core, equipment: "Bodyweight",
                     reps: 1, formCue: "Straight line head to heels, brace the core."),
            Exercise(name: "Leg Raises", muscleGroup: .core, equipment: "Bodyweight",
                     reps: 15, formCue: "Lower slow, keep low back pressed down."),
            Exercise(name: "Crunches", muscleGroup: .core, equipment: "Bodyweight",
                     reps: 25, formCue: "Curl ribs to hips, exhale at top."),
            Exercise(name: "Shoulder Press", muscleGroup: .shoulders, equipment: "Dumbbell/Machine",
                     formCue: "Press overhead, ribs down, don't flare excessively."),
            Exercise(name: "Pushups", muscleGroup: .chest, equipment: "Bodyweight",
                     reps: 10, formCue: "Elbows ~45°, full range, tight core."),
            Exercise(name: "Bent Over Rows", muscleGroup: .back, equipment: "Dumbbell/Barbell",
                     formCue: "Hinge forward, pull to hips, squeeze back."),
            Exercise(name: "Dips", muscleGroup: .arms, equipment: "Bodyweight/Bench",
                     reps: 20, formCue: "Lean slightly, lower under control, full lockout."),
            Exercise(name: "Tricep Kickbacks", muscleGroup: .arms, equipment: "Dumbbell",
                     formCue: "Elbow high and fixed, extend fully, squeeze tricep."),
            Exercise(name: "High Row", muscleGroup: .back, equipment: "Machine",
                     formCue: "Pull to upper chest, drive elbows back and down."),
            Exercise(name: "Chest Fly", muscleGroup: .chest, equipment: "Machine/Dumbbell",
                     formCue: "Soft elbows, hug the movement, big stretch."),
            Exercise(name: "Sit-ups", muscleGroup: .core, equipment: "Bodyweight",
                     reps: 25, formCue: "Controlled all the way up and down."),
            Exercise(name: "Toe Touches", muscleGroup: .core, equipment: "Bodyweight",
                     reps: 25, formCue: "Legs up, reach for toes, crunch the upper abs.")
        ]
    }

    // MARK: - Templates

    static func seedTemplates() -> [WorkoutTemplate] {
        [
            upperMachineDay(),
            lowerMachineDay(),
            lowerAthleticDay(),
            upperDumbbellMachineDay()
        ]
    }

    /// Helper to build an ordered list of template items from section/name/detail tuples.
    private static func makeItems(_ rows: [(section: String, name: String, detail: String)]) -> [TemplateItem] {
        rows.enumerated().map { index, row in
            TemplateItem(section: row.section, name: row.name, detail: row.detail, order: index)
        }
    }

    private static func upperMachineDay() -> WorkoutTemplate {
        let machines = "Machines · 3 sets of 12"
        let template = WorkoutTemplate(
            name: "Upper Machine Day",
            subtitle: "Machine-based upper body strength",
            type: .upperBody,
            items: makeItems([
                ("Warmup", "Elliptical", "10 minutes"),
                (machines, "Lat Pulldown", "3 × 12"),
                (machines, "Chest Press", "3 × 12"),
                (machines, "Seated Row", "3 × 12"),
                (machines, "Tricep Extension", "3 × 12"),
                (machines, "Bicep Curl", "3 × 12"),
                ("Finisher", "Bike", "10 minutes")
            ])
        )
        return template
    }

    private static func lowerMachineDay() -> WorkoutTemplate {
        let machines = "Machines · 3 sets of 12"
        return WorkoutTemplate(
            name: "Lower Machine Day",
            subtitle: "Machine-based lower body strength",
            type: .lowerBody,
            items: makeItems([
                ("Warmup", "Elliptical", "10 minutes"),
                (machines, "Leg Extension", "3 × 12"),
                (machines, "Leg Curl", "3 × 12"),
                (machines, "Leg Press", "3 × 12"),
                (machines, "Hip Adductor", "3 × 12"),
                (machines, "Hip Abductor", "3 × 12"),
                ("Finisher", "Bike", "10 minutes")
            ])
        )
    }

    private static func lowerAthleticDay() -> WorkoutTemplate {
        let machines = "Machines · 2 sets of 15"
        let dumbbells = "Dumbbells · 2 sets of 15"
        let core = "Core · 2 sets of 15"
        return WorkoutTemplate(
            name: "Lower Athletic Day",
            subtitle: "Power, strength, and core",
            type: .athleticFullBody,
            items: makeItems([
                (machines, "Leg Press", "2 × 15"),
                (machines, "Leg Extension", "2 × 15"),
                (machines, "Leg Curl", "2 × 15"),
                (machines, "Standing Calf Raises", "100 reps"),
                (dumbbells, "Romanian Deadlift", "2 × 15"),
                (dumbbells, "Deep Squat", "2 × 15"),
                (dumbbells, "Alternating Reverse Lunges", "2 × 15"),
                (core, "Elbow Plank", "30 seconds"),
                (core, "Leg Raises", "2 × 15"),
                (core, "Crunches", "2 × 15")
            ])
        )
    }

    private static func upperDumbbellMachineDay() -> WorkoutTemplate {
        let dumbbells = "Dumbbells · 3 sets of 12"
        let machines = "Machines · 3 sets of 12"
        let core = "Core · 3 sets of 25"
        return WorkoutTemplate(
            name: "Upper Dumbbell + Machine Day",
            subtitle: "Supersets and machine volume",
            type: .upperBody,
            items: makeItems([
                (dumbbells, "Shoulder Press + 10 Pushups", "3 × 12"),
                (dumbbells, "Bent Over Rows + 20 Dips", "3 × 12"),
                (dumbbells, "Bicep Curls + 10 Pushups", "3 × 12"),
                (dumbbells, "Tricep Kickbacks + 20 Dips", "3 × 12"),
                (machines, "High Row", "3 × 12"),
                (machines, "Chest Press", "3 × 12"),
                (machines, "Lat Pulldown", "3 × 12"),
                (machines, "Chest Fly", "3 × 12"),
                (core, "Sit-ups", "3 × 25"),
                (core, "Crunches", "3 × 25"),
                (core, "Toe Touches", "3 × 25")
            ])
        )
    }
}
