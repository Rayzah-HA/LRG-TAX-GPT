import SwiftUI
import SwiftData

/// Add or edit an exercise, including attaching a photo from library/camera.
struct ExerciseEditView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    /// When nil, we're creating a new exercise.
    private let existing: Exercise?

    @State private var name: String
    @State private var muscleGroup: MuscleGroup
    @State private var equipment: String
    @State private var sets: Int
    @State private var reps: Int
    @State private var startingWeight: Double
    @State private var currentWeight: Double
    @State private var formCue: String
    @State private var notes: String
    @State private var demoVideoURL: String
    @State private var photoData: Data?

    init(exercise: Exercise? = nil) {
        self.existing = exercise
        _name = State(initialValue: exercise?.name ?? "")
        _muscleGroup = State(initialValue: exercise?.muscleGroup ?? .fullBody)
        _equipment = State(initialValue: exercise?.equipment ?? "")
        _sets = State(initialValue: exercise?.sets ?? 3)
        _reps = State(initialValue: exercise?.reps ?? 12)
        _startingWeight = State(initialValue: exercise?.startingWeight ?? 0)
        _currentWeight = State(initialValue: exercise?.currentWeight ?? 0)
        _formCue = State(initialValue: exercise?.formCue ?? "")
        _notes = State(initialValue: exercise?.notes ?? "")
        _demoVideoURL = State(initialValue: exercise?.demoVideoURL ?? "")
        _photoData = State(initialValue: exercise?.photoData)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Photo") {
                    PhotoField(title: "Machine / Exercise Photo", data: $photoData)
                        .listRowInsets(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
                }

                Section("Basics") {
                    TextField("Name", text: $name)
                    Picker("Muscle Group", selection: $muscleGroup) {
                        ForEach(MuscleGroup.allCases) { Text($0.label).tag($0) }
                    }
                    TextField("Equipment", text: $equipment)
                }

                Section("Prescription") {
                    Stepper("Sets: \(sets)", value: $sets, in: 1...10)
                    Stepper("Reps: \(reps)", value: $reps, in: 1...100)
                }

                Section("Weight") {
                    HStack {
                        Text("Starting")
                        Spacer()
                        TextField("0", value: $startingWeight, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                    HStack {
                        Text("Current")
                        Spacer()
                        TextField("0", value: $currentWeight, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                }

                Section("Coaching") {
                    TextField("Form cue", text: $formCue, axis: .vertical)
                    TextField("Notes", text: $notes, axis: .vertical)
                    TextField("Demo video URL (optional)", text: $demoVideoURL)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(existing == nil ? "New Exercise" : "Edit Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
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
            existing.muscleGroup = muscleGroup
            existing.equipment = equipment
            existing.sets = sets
            existing.reps = reps
            existing.startingWeight = startingWeight
            existing.currentWeight = currentWeight
            existing.formCue = formCue
            existing.notes = notes
            existing.demoVideoURL = demoVideoURL
            existing.photoData = photoData
        } else {
            let exercise = Exercise(
                name: name,
                muscleGroup: muscleGroup,
                equipment: equipment,
                sets: sets,
                reps: reps,
                startingWeight: startingWeight,
                currentWeight: currentWeight,
                formCue: formCue,
                notes: notes,
                demoVideoURL: demoVideoURL,
                photoData: photoData
            )
            context.insert(exercise)
        }
        try? context.save()
        dismiss()
    }
}

#Preview {
    ExerciseEditView()
        .modelContainer(PreviewData.container)
}
