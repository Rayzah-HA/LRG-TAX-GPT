import SwiftUI
import SwiftData
import UIKit

@main
struct AthleticRebuildHQApp: App {
    /// The shared SwiftData container holding all models for this local-first app.
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(
                for: Exercise.self,
                Workout.self,
                WorkoutTemplate.self,
                TemplateItem.self,
                WeeklyPlanItem.self,
                DayExercise.self,
                BodyProgress.self,
                SuitFit.self,
                NutritionEntry.self,
                RecoveryEntry.self
            )
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }

        // Seed starter data on first launch.
        SeedData.seedIfNeeded(container.mainContext)

        // Style UIKit-backed bars to match the dark athletic theme.
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .preferredColorScheme(.dark)
                .tint(Theme.accentBright)
        }
        .modelContainer(container)
    }

    private func configureAppearance() {
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Theme.card)
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance

        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Theme.background)
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
    }
}
