import SwiftUI
import SwiftData

/// Add or edit a daily recovery check-in.
struct RecoveryEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    private let existing: RecoveryEntry?

    @State private var date: Date
    @State private var sleepHours: Double
    @State private var soreness: Int
    @State private var stress: Int
    @State private var motivation: Int
    @State private var hydration: Int
    @State private var mobilityWork: Bool
    @State private var notes: String

    init(entry: RecoveryEntry? = nil) {
        self.existing = entry
        _date = State(initialValue: entry?.date ?? .now)
        _sleepHours = State(initialValue: entry?.sleepHours ?? 7)
        _soreness = State(initialValue: entry?.soreness ?? 5)
        _stress = State(initialValue: entry?.stress ?? 5)
        _motivation = State(initialValue: entry?.motivation ?? 5)
        _hydration = State(initialValue: entry?.hydration ?? 5)
        _mobilityWork = State(initialValue: entry?.mobilityWork ?? false)
        _notes = State(initialValue: entry?.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section("Sleep") {
                    HStack {
                        Text("Sleep hours")
                        Spacer()
                        Text("\(sleepHours.clean)h")
                            .foregroundStyle(Theme.accentBright)
                    }
                    Slider(value: $sleepHours, in: 0...12, step: 0.5)
                        .tint(.blue)
                }

                Section("How You Feel") {
                    ScoreSlider(title: "Soreness", value: $soreness, tint: .orange)
                    ScoreSlider(title: "Stress", value: $stress, tint: .red)
                    ScoreSlider(title: "Motivation", value: $motivation, tint: .green)
                    ScoreSlider(title: "Hydration", value: $hydration, tint: .blue)
                }

                Section("Mobility") {
                    Toggle("Mobility work done", isOn: $mobilityWork)
                }

                Section("Notes") {
                    TextField("Recovery notes", text: $notes, axis: .vertical).lineLimit(3...6)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(existing == nil ? "Log Recovery" : "Edit Recovery")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { save() } }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func save() {
        if let existing {
            existing.date = date
            existing.sleepHours = sleepHours
            existing.soreness = soreness
            existing.stress = stress
            existing.motivation = motivation
            existing.hydration = hydration
            existing.mobilityWork = mobilityWork
            existing.notes = notes
        } else {
            let entry = RecoveryEntry(
                date: date, sleepHours: sleepHours, soreness: soreness, stress: stress,
                motivation: motivation, hydration: hydration, mobilityWork: mobilityWork, notes: notes
            )
            context.insert(entry)
        }
        try? context.save()
        dismiss()
    }
}

#Preview {
    RecoveryEditView()
        .modelContainer(PreviewData.container)
}
