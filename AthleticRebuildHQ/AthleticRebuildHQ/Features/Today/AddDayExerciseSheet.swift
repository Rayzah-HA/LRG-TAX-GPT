import SwiftUI

/// A searchable picker for adding a single exercise to a specific day.
struct AddDayExerciseSheet: View {
    let library: [Exercise]
    let onSelect: (Exercise) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    private var results: [Exercise] {
        guard !searchText.isEmpty else { return library }
        return library.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
            || $0.muscleGroup.label.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if results.isEmpty {
                    Text("No matching exercises. Add new ones in the Library.")
                        .font(.footnote)
                        .foregroundStyle(Theme.secondaryText)
                }
                ForEach(results) { exercise in
                    Button {
                        onSelect(exercise)
                        dismiss()
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(exercise.name)
                                    .foregroundStyle(Theme.primaryText)
                                Text("\(exercise.muscleGroup.label) · \(exercise.sets) × \(exercise.reps)")
                                    .font(.caption)
                                    .foregroundStyle(Theme.secondaryText)
                            }
                            Spacer()
                            Image(systemName: "plus.circle.fill")
                                .foregroundStyle(Theme.accentBright)
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Add Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search exercises")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
