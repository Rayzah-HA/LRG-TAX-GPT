import SwiftUI
import SwiftData

/// Add exercises to a weekday's recurring plan — either a whole template
/// (expands to all its exercises) or a single exercise.
struct ScheduleAddSheet: View {
    let weekday: Int

    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query private var planItems: [WeeklyPlanItem]
    @Query(sort: \WorkoutTemplate.createdAt) private var templates: [WorkoutTemplate]
    @Query(sort: \Exercise.name) private var exercises: [Exercise]

    @State private var mode: Mode = .template
    @State private var searchText = ""

    private enum Mode: String, CaseIterable, Identifiable {
        case template = "Template"
        case exercise = "Exercise"
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Add", selection: $mode) {
                    ForEach(Mode.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding()

                List {
                    if mode == .template {
                        templateList
                    } else {
                        exerciseList
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Add to \(DateHelper.weekdayName(weekday))")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: mode == .template ? "Search templates" : "Search exercises")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Lists

    private var templateList: some View {
        ForEach(filteredTemplates) { template in
            Button {
                add(template: template)
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(template.name).foregroundStyle(Theme.primaryText)
                        Text("\(template.items.count) exercises")
                            .font(.caption).foregroundStyle(Theme.secondaryText)
                    }
                    Spacer()
                    Image(systemName: "plus.circle.fill").foregroundStyle(Theme.accentBright)
                }
            }
        }
    }

    private var exerciseList: some View {
        ForEach(filteredExercises) { exercise in
            Button {
                add(exercise: exercise)
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(exercise.name).foregroundStyle(Theme.primaryText)
                        Text("\(exercise.muscleGroup.label) · \(exercise.sets) × \(exercise.reps)")
                            .font(.caption).foregroundStyle(Theme.secondaryText)
                    }
                    Spacer()
                    Image(systemName: "plus.circle.fill").foregroundStyle(Theme.accentBright)
                }
            }
        }
    }

    private var filteredTemplates: [WorkoutTemplate] {
        guard !searchText.isEmpty else { return templates }
        return templates.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    private var filteredExercises: [Exercise] {
        guard !searchText.isEmpty else { return exercises }
        return exercises.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
            || $0.muscleGroup.label.localizedCaseInsensitiveContains(searchText)
        }
    }

    // MARK: - Add actions

    private var nextOrder: Int {
        (planItems.filter { $0.weekday == weekday }.map(\.order).max() ?? -1) + 1
    }

    private func add(template: WorkoutTemplate) {
        var order = nextOrder
        for item in template.sortedItems {
            context.insert(WeeklyPlanItem(weekday: weekday, name: item.name,
                                          groupTitle: template.name, detail: item.detail, order: order))
            order += 1
        }
        try? context.save()
        dismiss()
    }

    private func add(exercise: Exercise) {
        context.insert(WeeklyPlanItem(weekday: weekday, name: exercise.name,
                                      groupTitle: "", detail: "\(exercise.sets) × \(exercise.reps)",
                                      order: nextOrder))
        try? context.save()
        // Stay open so several exercises can be added quickly.
    }
}
