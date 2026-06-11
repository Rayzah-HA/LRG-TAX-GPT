import SwiftUI
import SwiftData

/// History of logged workouts with quick add and access to templates.
struct WorkoutLogView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Workout.date, order: .reverse) private var workouts: [Workout]
    @State private var showingAdd = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if workouts.isEmpty {
                    EmptyStateView(systemImage: "figure.run",
                                   title: "No workouts yet",
                                   message: "Log your first session or start from a template.")
                } else {
                    ForEach(workouts) { workout in
                        NavigationLink {
                            WorkoutEditView(workout: workout)
                        } label: {
                            WorkoutRow(workout: workout)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Workouts")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink {
                    TemplatesView()
                } label: {
                    Label("Templates", systemImage: "list.bullet.rectangle")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingAdd) {
            WorkoutEditView()
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(workouts[index]) }
        try? context.save()
    }
}

struct WorkoutRow: View {
    let workout: Workout

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(workout.type.tint.opacity(0.2))
                    .frame(width: 52, height: 52)
                Image(systemName: workout.type.symbol)
                    .font(.title3)
                    .foregroundStyle(workout.type.tint)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(workout.type.label)
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                Text(workout.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.subheadline)
                    .foregroundStyle(Theme.secondaryText)
                HStack(spacing: 8) {
                    Text("\(workout.durationMinutes) min")
                    Text("·")
                    Text("Energy \(workout.energyLevel)/10")
                    if workout.cardioCompleted {
                        Image(systemName: "heart.fill").foregroundStyle(.pink)
                    }
                    if workout.stretchingCompleted {
                        Image(systemName: "figure.flexibility").foregroundStyle(.teal)
                    }
                }
                .font(.caption)
                .foregroundStyle(Theme.secondaryText)
            }
            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .cardStyle()
    }
}

#Preview {
    NavigationStack {
        WorkoutLogView()
    }
    .modelContainer(PreviewData.container)
}
