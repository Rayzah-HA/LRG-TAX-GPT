import SwiftUI

/// Top-level tab navigation. Five core tabs keep one-handed gym use simple;
/// secondary screens (Templates, Suit Fit, Nutrition) are reachable from both
/// the Dashboard and the relevant tab's toolbar.
struct RootTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                DashboardView()
            }
            .tabItem { Label("Home", systemImage: "house.fill") }

            NavigationStack {
                WorkoutLogView()
            }
            .tabItem { Label("Workouts", systemImage: "figure.run") }

            NavigationStack {
                ExerciseLibraryView()
            }
            .tabItem { Label("Library", systemImage: "square.grid.2x2.fill") }

            NavigationStack {
                BodyProgressView()
            }
            .tabItem { Label("Body", systemImage: "chart.line.uptrend.xyaxis") }

            NavigationStack {
                RecoveryView()
            }
            .tabItem { Label("Recovery", systemImage: "heart.fill") }
        }
        .tint(Theme.accentBright)
    }
}

#Preview {
    RootTabView()
        .modelContainer(PreviewData.container)
}
