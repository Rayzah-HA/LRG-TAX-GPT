import SwiftUI
import SwiftData

/// Simple daily nutrition habit tracker.
struct NutritionView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \NutritionEntry.date, order: .reverse) private var entries: [NutritionEntry]
    @State private var showingAdd = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if entries.isEmpty {
                    EmptyStateView(systemImage: "fork.knife",
                                   title: "No nutrition logs",
                                   message: "Track protein, water, and habits day to day.")
                } else {
                    ForEach(entries) { entry in
                        NavigationLink {
                            NutritionEditView(entry: entry)
                        } label: {
                            NutritionRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Nutrition")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingAdd) {
            NutritionEditView()
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(entries[index]) }
        try? context.save()
    }
}

struct NutritionRow: View {
    let entry: NutritionEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                Spacer()
                TagPill(text: entry.calorieEstimate.label, tint: entry.calorieEstimate.tint)
            }
            HStack(spacing: 8) {
                habitBadge("Protein", "bolt.fill", entry.proteinGoalHit)
                habitBadge("Water", "drop.fill", entry.waterGoalHit)
                habitBadge("\(entry.fruitsVegetables) F/V", "leaf.fill", entry.fruitsVegetables > 0)
                if entry.fastFood { habitBadge("Fast food", "takeoutbag.and.cup.and.straw.fill", true, negative: true) }
                if entry.alcohol { habitBadge("Alcohol", "wineglass.fill", true, negative: true) }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }

    private func habitBadge(_ title: String, _ symbol: String, _ on: Bool, negative: Bool = false) -> some View {
        let tint: Color = on ? (negative ? .orange : .green) : Theme.secondaryText
        return Label(title, systemImage: symbol)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(tint)
    }
}

#Preview {
    NavigationStack {
        NutritionView()
    }
    .modelContainer(PreviewData.container)
}
