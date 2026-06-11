import SwiftUI
import SwiftData

/// Set up the recurring weekly plan: for each weekday, the exercises you do.
/// The Today screen pre-fills each day from this, while still letting you edit
/// individual days.
struct WeeklyScheduleView: View {
    @Environment(\.modelContext) private var context
    @Query private var planItems: [WeeklyPlanItem]
    @State private var addTarget: WeekdayTarget?

    /// Identifiable wrapper so a weekday number can drive a `.sheet(item:)`.
    private struct WeekdayTarget: Identifiable { let weekday: Int; var id: Int { weekday } }

    var body: some View {
        List {
            ForEach(DateHelper.orderedWeekdays(), id: \.self) { weekday in
                Section {
                    let items = items(for: weekday)
                    if items.isEmpty {
                        Text("Rest day — nothing scheduled")
                            .font(.subheadline)
                            .foregroundStyle(Theme.secondaryText)
                    } else {
                        ForEach(items) { item in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.name)
                                    .foregroundStyle(Theme.primaryText)
                                HStack(spacing: 6) {
                                    if !item.groupTitle.isEmpty {
                                        Text(item.groupTitle)
                                            .foregroundStyle(Theme.accentBright)
                                    }
                                    if !item.detail.isEmpty {
                                        Text(item.detail)
                                            .foregroundStyle(Theme.secondaryText)
                                    }
                                }
                                .font(.caption)
                            }
                        }
                        .onDelete { offsets in delete(offsets, from: weekday) }
                    }

                    Button {
                        addTarget = WeekdayTarget(weekday: weekday)
                    } label: {
                        Label("Add to \(DateHelper.weekdayName(weekday))", systemImage: "plus.circle.fill")
                            .foregroundStyle(Theme.accentBright)
                    }
                } header: {
                    Text(DateHelper.weekdayName(weekday))
                        .foregroundStyle(Theme.primaryText)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Weekly Schedule")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $addTarget) { target in
            ScheduleAddSheet(weekday: target.weekday)
        }
    }

    private func items(for weekday: Int) -> [WeeklyPlanItem] {
        planItems.filter { $0.weekday == weekday }.sorted { $0.order < $1.order }
    }

    private func delete(_ offsets: IndexSet, from weekday: Int) {
        let items = items(for: weekday)
        for index in offsets { context.delete(items[index]) }
        try? context.save()
    }
}

#Preview {
    NavigationStack {
        WeeklyScheduleView()
    }
    .modelContainer(PreviewData.container)
}
