import Foundation
import SwiftData

/// In-memory container with sample data for SwiftUI previews. Never used in
/// the shipping app — only by `#Preview` blocks.
@MainActor
enum PreviewData {
    static let container: ModelContainer = {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try! ModelContainer(
            for: Exercise.self,
            Workout.self,
            WorkoutTemplate.self,
            TemplateItem.self,
            WeeklyPlanItem.self,
            DayExercise.self,
            BodyProgress.self,
            SuitFit.self,
            NutritionEntry.self,
            RecoveryEntry.self,
            configurations: config
        )
        let context = container.mainContext

        // Library + templates.
        for exercise in SeedData.seedExercises() { context.insert(exercise) }
        for template in SeedData.seedTemplates() { context.insert(template) }

        // Weekly schedule for today's weekday + a partly-completed "today".
        let weekday = DateHelper.weekday(.now)
        let todayStart = DateHelper.startOfDay(.now)
        let sample = ["Lat Pulldown", "Chest Press", "Seated Row", "Tricep Extension", "Bicep Curl"]
        for (index, name) in sample.enumerated() {
            context.insert(WeeklyPlanItem(weekday: weekday, name: name,
                                          groupTitle: "Upper Machine Day", detail: "3 × 12", order: index))
            context.insert(DayExercise(date: todayStart, name: name,
                                       groupTitle: "Upper Machine Day", detail: "3 × 12", order: index,
                                       isCompleted: index < 2,
                                       completedAt: index < 2 ? .now : nil))
        }

        // A few recent workouts.
        let calendar = Calendar.current
        let today = Date()
        context.insert(Workout(date: today, type: .upperBody, durationMinutes: 50, energyLevel: 8,
                               notes: "Strong session.", completedExercises: ["Lat Pulldown", "Chest Press"],
                               cardioCompleted: true, stretchingCompleted: true, templateName: "Upper Machine Day"))
        context.insert(Workout(date: calendar.date(byAdding: .day, value: -2, to: today)!,
                               type: .lowerBody, durationMinutes: 45, energyLevel: 7))
        context.insert(Workout(date: calendar.date(byAdding: .day, value: -4, to: today)!,
                               type: .boxingCardio, durationMinutes: 30, energyLevel: 6, cardioCompleted: true))

        // Body progress.
        context.insert(BodyProgress(date: calendar.date(byAdding: .day, value: -14, to: today)!,
                                    weight: 205, waist: 36, chest: 44, arms: 15.5, thighs: 24))
        context.insert(BodyProgress(date: today, weight: 201, waist: 35, chest: 44.5, arms: 15.8, thighs: 24.2,
                                    sleepScore: 7, stressScore: 4, energyScore: 8, notes: "Trending down."))

        // Suit fit.
        context.insert(SuitFit(name: "Navy Two-Piece", brand: "SuitSupply", fitStatus: .snug,
                               waistFeel: "A touch tight", jacketFeel: "Good in shoulders",
                               confidenceRating: 7, goalFit: "Perfect by Q3"))

        // Nutrition + recovery.
        context.insert(NutritionEntry(date: today, proteinGoalHit: true, waterGoalHit: true,
                                      fruitsVegetables: 4, calorieEstimate: .lightDeficit, hungerLevel: 4))
        context.insert(RecoveryEntry(date: today, sleepHours: 7.5, soreness: 3, stress: 4,
                                     motivation: 8, hydration: 7, mobilityWork: true))

        try? context.save()
        return container
    }()
}
