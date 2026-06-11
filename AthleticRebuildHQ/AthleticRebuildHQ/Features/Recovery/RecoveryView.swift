import SwiftUI
import SwiftData

/// Daily recovery tracker. The latest entry drives the dashboard's recovery
/// score. Includes quick access to Nutrition.
struct RecoveryView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \RecoveryEntry.date, order: .reverse) private var entries: [RecoveryEntry]
    @State private var showingAdd = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if let latest = entries.first {
                    scoreCard(latest)
                }

                if entries.isEmpty {
                    EmptyStateView(systemImage: "heart.fill",
                                   title: "No recovery logs",
                                   message: "Track sleep, soreness, and stress to manage your rebuild.")
                } else {
                    ForEach(entries) { entry in
                        NavigationLink {
                            RecoveryEditView(entry: entry)
                        } label: {
                            RecoveryRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Recovery")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink {
                    NutritionView()
                } label: {
                    Label("Nutrition", systemImage: "fork.knife")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingAdd) {
            RecoveryEditView()
        }
    }

    private func scoreCard(_ entry: RecoveryEntry) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader("Today's Recovery")
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(entry.recoveryScore)")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .foregroundStyle(scoreColor(entry.recoveryScore))
                Text("/ 100")
                    .font(.title3)
                    .foregroundStyle(Theme.secondaryText)
            }
            ProgressBar(progress: Double(entry.recoveryScore) / 100, tint: scoreColor(entry.recoveryScore))
            Text("\(entry.sleepHours.clean)h sleep · soreness \(entry.soreness)/10 · stress \(entry.stress)/10")
                .font(.subheadline)
                .foregroundStyle(Theme.secondaryText)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }

    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 80...: return .green
        case 60..<80: return Theme.accentBright
        case 40..<60: return .orange
        default: return .red
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(entries[index]) }
        try? context.save()
    }
}

struct RecoveryRow: View {
    let entry: RecoveryEntry

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Theme.cardElevated)
                    .frame(width: 52, height: 52)
                Text("\(entry.recoveryScore)")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Theme.accentBright)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                Text("\(entry.sleepHours.clean)h sleep · motivation \(entry.motivation)/10")
                    .font(.caption)
                    .foregroundStyle(Theme.secondaryText)
                if entry.mobilityWork {
                    Label("Mobility done", systemImage: "figure.flexibility")
                        .font(.caption2)
                        .foregroundStyle(.teal)
                }
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(Theme.secondaryText)
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .cardStyle()
    }
}

#Preview {
    NavigationStack {
        RecoveryView()
    }
    .modelContainer(PreviewData.container)
}
