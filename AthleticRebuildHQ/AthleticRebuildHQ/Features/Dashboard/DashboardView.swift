import SwiftUI
import SwiftData
import UIKit

/// The home screen: a masculine athletic dashboard summarizing the week at a
/// glance with quick links into every tracker.
struct DashboardView: View {
    @Query(sort: \Workout.date, order: .reverse) private var workouts: [Workout]
    @Query(sort: \BodyProgress.date, order: .reverse) private var progress: [BodyProgress]
    @Query(sort: \RecoveryEntry.date, order: .reverse) private var recovery: [RecoveryEntry]
    @Query(sort: \SuitFit.lastWorn, order: .forward) private var suits: [SuitFit]
    @Query private var templates: [WorkoutTemplate]

    private let columns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header

                // Today's workout / suggestion.
                todaysWorkoutCard

                // Metric grid.
                LazyVGrid(columns: columns, spacing: 14) {
                    StatTile(title: "Workouts This Week",
                             value: "\(weeklyWorkoutCount)",
                             caption: "\(weeklyWorkoutCount >= 4 ? "On pace" : "Keep going")",
                             systemImage: "flame.fill", tint: .orange)

                    StatTile(title: "Current Weight",
                             value: currentWeightText,
                             caption: weightTrendText,
                             systemImage: "scalemass.fill", tint: .blue)

                    StatTile(title: "Cardio This Week",
                             value: "\(weeklyCardioMinutes) min",
                             systemImage: "heart.fill", tint: .pink)

                    StatTile(title: "Recovery Score",
                             value: recoveryScoreText,
                             caption: recoveryCaption,
                             systemImage: "bolt.heart.fill", tint: .green)
                }

                lastProgressPhotoCard
                suitFitReminderCard
                quickLinks
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Athletic Rebuild HQ")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(greeting)
                .font(.title.weight(.bold))
                .foregroundStyle(Theme.primaryText)
            Text("Rebuild the conditioning. Earn the confidence.")
                .font(.subheadline)
                .foregroundStyle(Theme.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var todaysWorkoutCard: some View {
        NavigationLink {
            WorkoutLogView()
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("Today", systemImage: "calendar")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.secondaryText)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(Theme.secondaryText)
                }
                if let todays = todaysWorkout {
                    HStack(spacing: 12) {
                        Image(systemName: todays.type.symbol)
                            .font(.title)
                            .foregroundStyle(todays.type.tint)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(todays.type.label)
                                .font(.title3.weight(.bold))
                                .foregroundStyle(Theme.primaryText)
                            Text("\(todays.durationMinutes) min · Energy \(todays.energyLevel)/10")
                                .font(.subheadline)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                } else {
                    HStack(spacing: 12) {
                        Image(systemName: "dumbbell.fill")
                            .font(.title)
                            .foregroundStyle(Theme.accentBright)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("No workout logged yet")
                                .font(.title3.weight(.bold))
                                .foregroundStyle(Theme.primaryText)
                            Text(suggestionText)
                                .font(.subheadline)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .cardStyle()
        }
        .buttonStyle(.plain)
    }

    private var lastProgressPhotoCard: some View {
        NavigationLink {
            BodyProgressView()
        } label: {
            HStack(spacing: 14) {
                if let data = progress.first?.primaryPhotoData, let image = UIImage(data: data) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 70, height: 90)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                } else {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Theme.cardElevated)
                        .frame(width: 70, height: 90)
                        .overlay {
                            Image(systemName: "camera.fill").foregroundStyle(Theme.secondaryText)
                        }
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Last Progress Photo")
                        .font(.headline)
                        .foregroundStyle(Theme.primaryText)
                    Text(lastProgressText)
                        .font(.subheadline)
                        .foregroundStyle(Theme.secondaryText)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.secondaryText)
            }
            .padding(16)
            .frame(maxWidth: .infinity)
            .cardStyle()
        }
        .buttonStyle(.plain)
    }

    private var suitFitReminderCard: some View {
        NavigationLink {
            SuitFitView()
        } label: {
            HStack(spacing: 14) {
                Image(systemName: "figure.dress.line.vertical.figure")
                    .font(.title)
                    .foregroundStyle(Theme.accentBright)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Suit Fit Reminder")
                        .font(.headline)
                        .foregroundStyle(Theme.primaryText)
                    Text(suitReminderText)
                        .font(.subheadline)
                        .foregroundStyle(Theme.secondaryText)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.secondaryText)
            }
            .padding(16)
            .frame(maxWidth: .infinity)
            .cardStyle()
        }
        .buttonStyle(.plain)
    }

    private var quickLinks: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader("Quick Access")
            LazyVGrid(columns: columns, spacing: 14) {
                quickLink("Templates", "list.bullet.rectangle.fill", .orange) { TemplatesView() }
                quickLink("Log Workout", "plus.circle.fill", .red) { WorkoutLogView() }
                quickLink("Nutrition", "fork.knife", .mint) { NutritionView() }
                quickLink("Recovery", "bed.double.fill", .green) { RecoveryView() }
            }
        }
    }

    private func quickLink<Destination: View>(
        _ title: String,
        _ symbol: String,
        _ tint: Color,
        @ViewBuilder destination: @escaping () -> Destination
    ) -> some View {
        NavigationLink {
            destination()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: symbol)
                    .font(.headline)
                    .foregroundStyle(tint)
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.primaryText)
                Spacer()
            }
            .padding(16)
            .frame(maxWidth: .infinity)
            .cardStyle()
        }
        .buttonStyle(.plain)
    }

    // MARK: - Derived data

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var todaysWorkout: Workout? {
        workouts.first { Calendar.current.isDateInToday($0.date) }
    }

    private var thisWeekWorkouts: [Workout] {
        workouts.filter { DateHelper.isInCurrentWeek($0.date) }
    }

    private var weeklyWorkoutCount: Int { thisWeekWorkouts.count }

    private var weeklyCardioMinutes: Int {
        thisWeekWorkouts
            .filter { $0.cardioCompleted || $0.type == .boxingCardio || $0.type == .basketball }
            .reduce(0) { $0 + $1.durationMinutes }
    }

    private var currentWeightText: String {
        guard let weight = progress.first?.weight, weight > 0 else { return "—" }
        return "\(weight.clean) lb"
    }

    private var weightTrendText: String {
        guard progress.count >= 2 else { return "Log to track" }
        let delta = progress[0].weight - progress[1].weight
        guard delta != 0 else { return "No change" }
        return delta < 0 ? "↓ \(abs(delta).clean) lb" : "↑ \(delta.clean) lb"
    }

    private var recoveryScoreText: String {
        guard let latest = recovery.first else { return "—" }
        return "\(latest.recoveryScore)"
    }

    private var recoveryCaption: String {
        guard let latest = recovery.first else { return "Log recovery" }
        switch latest.recoveryScore {
        case 80...: return "Primed"
        case 60..<80: return "Solid"
        case 40..<60: return "Take it easy"
        default: return "Rest needed"
        }
    }

    private var lastProgressText: String {
        guard let last = progress.first else { return "Add your first photo" }
        return "Updated \(last.date.formatted(date: .abbreviated, time: .omitted))"
    }

    private var suitReminderText: String {
        guard let suit = suits.first else { return "Add a suit to track your fit" }
        let days = Calendar.current.dateComponents([.day], from: suit.lastWorn, to: .now).day ?? 0
        return "\(suit.name): \(suit.fitStatus.label) · worn \(days)d ago"
    }

    private var suggestionText: String {
        if let template = templates.first {
            return "Try: \(template.name)"
        }
        return "Tap to log your session"
    }
}

#Preview {
    NavigationStack {
        DashboardView()
    }
    .modelContainer(PreviewData.container)
}
