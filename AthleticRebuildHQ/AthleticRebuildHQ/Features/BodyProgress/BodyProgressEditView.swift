import SwiftUI
import SwiftData

/// Add or edit a body progress entry, including front/side/back photos.
struct BodyProgressEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    private let existing: BodyProgress?

    @State private var date: Date
    @State private var weight: Double
    @State private var waist: Double
    @State private var chest: Double
    @State private var arms: Double
    @State private var thighs: Double
    @State private var sleepScore: Int
    @State private var stressScore: Int
    @State private var energyScore: Int
    @State private var notes: String
    @State private var frontPhoto: Data?
    @State private var sidePhoto: Data?
    @State private var backPhoto: Data?

    init(entry: BodyProgress? = nil) {
        self.existing = entry
        _date = State(initialValue: entry?.date ?? .now)
        _weight = State(initialValue: entry?.weight ?? 0)
        _waist = State(initialValue: entry?.waist ?? 0)
        _chest = State(initialValue: entry?.chest ?? 0)
        _arms = State(initialValue: entry?.arms ?? 0)
        _thighs = State(initialValue: entry?.thighs ?? 0)
        _sleepScore = State(initialValue: entry?.sleepScore ?? 5)
        _stressScore = State(initialValue: entry?.stressScore ?? 5)
        _energyScore = State(initialValue: entry?.energyScore ?? 5)
        _notes = State(initialValue: entry?.notes ?? "")
        _frontPhoto = State(initialValue: entry?.frontPhotoData)
        _sidePhoto = State(initialValue: entry?.sidePhotoData)
        _backPhoto = State(initialValue: entry?.backPhotoData)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section("Measurements") {
                    measurementRow("Weight (lb)", $weight)
                    measurementRow("Waist (in)", $waist)
                    measurementRow("Chest (in)", $chest)
                    measurementRow("Arms (in)", $arms)
                    measurementRow("Thighs (in)", $thighs)
                }

                Section("How You Feel") {
                    ScoreSlider(title: "Sleep", value: $sleepScore, tint: .blue)
                    ScoreSlider(title: "Stress", value: $stressScore, tint: .orange)
                    ScoreSlider(title: "Energy", value: $energyScore, tint: .green)
                }

                Section("Progress Photos") {
                    PhotoField(title: "Front", data: $frontPhoto, height: 220)
                    PhotoField(title: "Side", data: $sidePhoto, height: 220)
                    PhotoField(title: "Back", data: $backPhoto, height: 220)
                }

                Section("Notes") {
                    TextField("Notes", text: $notes, axis: .vertical).lineLimit(3...6)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(existing == nil ? "New Entry" : "Edit Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { save() } }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func measurementRow(_ title: String, _ value: Binding<Double>) -> some View {
        HStack {
            Text(title)
            Spacer()
            TextField("0", value: value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
        }
    }

    private func save() {
        if let existing {
            existing.date = date
            existing.weight = weight
            existing.waist = waist
            existing.chest = chest
            existing.arms = arms
            existing.thighs = thighs
            existing.sleepScore = sleepScore
            existing.stressScore = stressScore
            existing.energyScore = energyScore
            existing.notes = notes
            existing.frontPhotoData = frontPhoto
            existing.sidePhotoData = sidePhoto
            existing.backPhotoData = backPhoto
        } else {
            let entry = BodyProgress(
                date: date, weight: weight, waist: waist, chest: chest, arms: arms, thighs: thighs,
                sleepScore: sleepScore, stressScore: stressScore, energyScore: energyScore, notes: notes,
                frontPhotoData: frontPhoto, sidePhotoData: sidePhoto, backPhotoData: backPhoto
            )
            context.insert(entry)
        }
        try? context.save()
        dismiss()
    }
}

#Preview {
    BodyProgressEditView()
        .modelContainer(PreviewData.container)
}
