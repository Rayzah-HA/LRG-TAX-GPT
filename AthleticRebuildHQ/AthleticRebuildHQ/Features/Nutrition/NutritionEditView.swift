import SwiftUI
import SwiftData

/// Add or edit a daily nutrition check-in.
struct NutritionEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    private let existing: NutritionEntry?

    @State private var date: Date
    @State private var proteinGoalHit: Bool
    @State private var waterGoalHit: Bool
    @State private var fruitsVegetables: Int
    @State private var fastFood: Bool
    @State private var alcohol: Bool
    @State private var calorieEstimate: CalorieEstimate
    @State private var hungerLevel: Int
    @State private var notes: String

    init(entry: NutritionEntry? = nil) {
        self.existing = entry
        _date = State(initialValue: entry?.date ?? .now)
        _proteinGoalHit = State(initialValue: entry?.proteinGoalHit ?? false)
        _waterGoalHit = State(initialValue: entry?.waterGoalHit ?? false)
        _fruitsVegetables = State(initialValue: entry?.fruitsVegetables ?? 0)
        _fastFood = State(initialValue: entry?.fastFood ?? false)
        _alcohol = State(initialValue: entry?.alcohol ?? false)
        _calorieEstimate = State(initialValue: entry?.calorieEstimate ?? .maintenance)
        _hungerLevel = State(initialValue: entry?.hungerLevel ?? 5)
        _notes = State(initialValue: entry?.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section("Habits") {
                    Toggle("Protein goal hit", isOn: $proteinGoalHit)
                    Toggle("Water goal hit", isOn: $waterGoalHit)
                    Stepper("Fruits/Veg servings: \(fruitsVegetables)", value: $fruitsVegetables, in: 0...20)
                    Toggle("Fast food", isOn: $fastFood)
                    Toggle("Alcohol", isOn: $alcohol)
                }

                Section("Intake") {
                    Picker("Calories", selection: $calorieEstimate) {
                        ForEach(CalorieEstimate.allCases) { Text($0.label).tag($0) }
                    }
                    ScoreSlider(title: "Hunger Level", value: $hungerLevel, tint: .orange)
                }

                Section("Notes") {
                    TextField("Notes", text: $notes, axis: .vertical).lineLimit(3...6)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(existing == nil ? "Log Nutrition" : "Edit Nutrition")
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
            existing.proteinGoalHit = proteinGoalHit
            existing.waterGoalHit = waterGoalHit
            existing.fruitsVegetables = fruitsVegetables
            existing.fastFood = fastFood
            existing.alcohol = alcohol
            existing.calorieEstimate = calorieEstimate
            existing.hungerLevel = hungerLevel
            existing.notes = notes
        } else {
            let entry = NutritionEntry(
                date: date, proteinGoalHit: proteinGoalHit, waterGoalHit: waterGoalHit,
                fruitsVegetables: fruitsVegetables, fastFood: fastFood, alcohol: alcohol,
                calorieEstimate: calorieEstimate, hungerLevel: hungerLevel, notes: notes
            )
            context.insert(entry)
        }
        try? context.save()
        dismiss()
    }
}

#Preview {
    NutritionEditView()
        .modelContainer(PreviewData.container)
}
