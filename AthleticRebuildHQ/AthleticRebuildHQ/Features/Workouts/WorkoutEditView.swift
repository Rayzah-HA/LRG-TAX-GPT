import SwiftUI
import SwiftData

/// Log a new workout, edit an existing one, or start one pre-filled from a
/// template. Designed for minimal typing: big toggles, steppers, and a
/// tap-to-complete exercise checklist.
struct WorkoutEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Exercise.name) private var allExercises: [Exercise]

    private let existing: Workout?

    @State private var date: Date
    @State private var type: WorkoutType
    @State private var durationMinutes: Int
    @State private var energyLevel: Int
    @State private var notes: String
    @State private var completed: Set<String>
    @State private var cardioCompleted: Bool
    @State private var stretchingCompleted: Bool
    @State private var templateName: String
    /// Suggested exercise names from the template (shown first for quick tapping).
    private let suggestedExercises: [String]

    /// New / edit initializer.
    init(workout: Workout? = nil) {
        self.existing = workout
        _date = State(initialValue: workout?.date ?? .now)
        _type = State(initialValue: workout?.type ?? .upperBody)
        _durationMinutes = State(initialValue: workout?.durationMinutes ?? 45)
        _energyLevel = State(initialValue: workout?.energyLevel ?? 7)
        _notes = State(initialValue: workout?.notes ?? "")
        _completed = State(initialValue: Set(workout?.completedExercises ?? []))
        _cardioCompleted = State(initialValue: workout?.cardioCompleted ?? false)
        _stretchingCompleted = State(initialValue: workout?.stretchingCompleted ?? false)
        _templateName = State(initialValue: workout?.templateName ?? "")
        suggestedExercises = workout?.completedExercises ?? []
    }

    /// Start-from-template initializer.
    init(template: WorkoutTemplate) {
        self.existing = nil
        _date = State(initialValue: .now)
        _type = State(initialValue: template.type)
        _durationMinutes = State(initialValue: 45)
        _energyLevel = State(initialValue: 7)
        _notes = State(initialValue: "")
        _completed = State(initialValue: [])
        _cardioCompleted = State(initialValue: false)
        _stretchingCompleted = State(initialValue: false)
        _templateName = State(initialValue: template.name)
        // De-duplicate template item names for the checklist.
        var seen = Set<String>()
        suggestedExercises = template.sortedItems.compactMap { item in
            guard !seen.contains(item.name) else { return nil }
            seen.insert(item.name)
            return item.name
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                    Picker("Type", selection: $type) {
                        ForEach(WorkoutType.allCases) { type in
                            Label(type.label, systemImage: type.symbol).tag(type)
                        }
                    }
                    Stepper("Duration: \(durationMinutes) min", value: $durationMinutes, in: 5...240, step: 5)
                }

                Section("Energy") {
                    ScoreSlider(title: "Energy Level", value: $energyLevel)
                }

                Section("Done") {
                    Toggle("Cardio completed", isOn: $cardioCompleted)
                    Toggle("Stretching completed", isOn: $stretchingCompleted)
                }

                Section("Exercises Completed") {
                    if exerciseChecklist.isEmpty {
                        Text("Add exercises to your library to check them off here.")
                            .font(.footnote)
                            .foregroundStyle(Theme.secondaryText)
                    } else {
                        ForEach(exerciseChecklist, id: \.self) { name in
                            Button {
                                toggle(name)
                            } label: {
                                HStack {
                                    Image(systemName: completed.contains(name) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(completed.contains(name) ? Theme.accentBright : Theme.secondaryText)
                                    Text(name)
                                        .foregroundStyle(Theme.primaryText)
                                    Spacer()
                                }
                            }
                        }
                    }
                }

                Section("Notes") {
                    TextField("How did it go?", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(existing == nil ? "Log Workout" : "Edit Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    /// Template suggestions first, then any other library exercises, deduped.
    private var exerciseChecklist: [String] {
        var names = suggestedExercises
        var seen = Set(names)
        for exercise in allExercises where !seen.contains(exercise.name) {
            names.append(exercise.name)
            seen.insert(exercise.name)
        }
        return names
    }

    private func toggle(_ name: String) {
        if completed.contains(name) { completed.remove(name) } else { completed.insert(name) }
    }

    private func save() {
        let ordered = exerciseChecklist.filter { completed.contains($0) }
        if let existing {
            existing.date = date
            existing.type = type
            existing.durationMinutes = durationMinutes
            existing.energyLevel = energyLevel
            existing.notes = notes
            existing.completedExercises = ordered
            existing.cardioCompleted = cardioCompleted
            existing.stretchingCompleted = stretchingCompleted
            existing.templateName = templateName
        } else {
            let workout = Workout(
                date: date,
                type: type,
                durationMinutes: durationMinutes,
                energyLevel: energyLevel,
                notes: notes,
                completedExercises: ordered,
                cardioCompleted: cardioCompleted,
                stretchingCompleted: stretchingCompleted,
                templateName: templateName
            )
            context.insert(workout)
        }
        try? context.save()
        dismiss()
    }
}

#Preview {
    WorkoutEditView()
        .modelContainer(PreviewData.container)
}
