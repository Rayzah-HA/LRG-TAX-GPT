import SwiftUI
import SwiftData

/// Add or edit a tracked suit.
struct SuitFitEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    private let existing: SuitFit?

    @State private var name: String
    @State private var brand: String
    @State private var fitStatus: SuitFitStatus
    @State private var waistFeel: String
    @State private var jacketFeel: String
    @State private var confidenceRating: Int
    @State private var lastWorn: Date
    @State private var goalFit: String
    @State private var photoData: Data?

    init(suit: SuitFit? = nil) {
        self.existing = suit
        _name = State(initialValue: suit?.name ?? "")
        _brand = State(initialValue: suit?.brand ?? "")
        _fitStatus = State(initialValue: suit?.fitStatus ?? .snug)
        _waistFeel = State(initialValue: suit?.waistFeel ?? "")
        _jacketFeel = State(initialValue: suit?.jacketFeel ?? "")
        _confidenceRating = State(initialValue: suit?.confidenceRating ?? 5)
        _lastWorn = State(initialValue: suit?.lastWorn ?? .now)
        _goalFit = State(initialValue: suit?.goalFit ?? "")
        _photoData = State(initialValue: suit?.photoData)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Photo") {
                    PhotoField(title: "Suit Photo", data: $photoData, height: 240)
                        .listRowInsets(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
                }

                Section("Suit") {
                    TextField("Name", text: $name)
                    TextField("Brand", text: $brand)
                    Picker("Fit Status", selection: $fitStatus) {
                        ForEach(SuitFitStatus.allCases) { Text($0.label).tag($0) }
                    }
                    DatePicker("Last Worn", selection: $lastWorn, displayedComponents: .date)
                }

                Section("Feel") {
                    TextField("Waist feel", text: $waistFeel)
                    TextField("Jacket feel", text: $jacketFeel)
                    ScoreSlider(title: "Confidence", value: $confidenceRating)
                }

                Section("Goal") {
                    TextField("Goal fit (e.g. Perfect by Q3)", text: $goalFit, axis: .vertical)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(existing == nil ? "New Suit" : "Edit Suit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func save() {
        if let existing {
            existing.name = name
            existing.brand = brand
            existing.fitStatus = fitStatus
            existing.waistFeel = waistFeel
            existing.jacketFeel = jacketFeel
            existing.confidenceRating = confidenceRating
            existing.lastWorn = lastWorn
            existing.goalFit = goalFit
            existing.photoData = photoData
        } else {
            let suit = SuitFit(
                name: name, brand: brand, fitStatus: fitStatus, waistFeel: waistFeel,
                jacketFeel: jacketFeel, confidenceRating: confidenceRating, lastWorn: lastWorn,
                goalFit: goalFit, photoData: photoData
            )
            context.insert(suit)
        }
        try? context.save()
        dismiss()
    }
}

#Preview {
    SuitFitEditView()
        .modelContainer(PreviewData.container)
}
