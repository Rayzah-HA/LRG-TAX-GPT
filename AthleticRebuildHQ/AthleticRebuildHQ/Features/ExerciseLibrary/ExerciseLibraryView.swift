import SwiftUI
import SwiftData
import UIKit

/// Gallery-style exercise library with image cards and muscle-group filtering.
struct ExerciseLibraryView: View {
    @Query(sort: \Exercise.name) private var exercises: [Exercise]

    @State private var searchText = ""
    @State private var selectedGroup: MuscleGroup?
    @State private var showingAdd = false

    private let columns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                filterChips

                if filteredExercises.isEmpty {
                    EmptyStateView(systemImage: "square.grid.2x2",
                                   title: "No exercises",
                                   message: "Tap + to add an exercise and attach a photo of the machine.")
                } else {
                    LazyVGrid(columns: columns, spacing: 14) {
                        ForEach(filteredExercises) { exercise in
                            NavigationLink {
                                ExerciseDetailView(exercise: exercise)
                            } label: {
                                ExerciseCard(exercise: exercise)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Exercise Library")
        .searchable(text: $searchText, prompt: "Search exercises")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingAdd = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAdd) {
            ExerciseEditView()
        }
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(title: "All", isSelected: selectedGroup == nil) { selectedGroup = nil }
                ForEach(MuscleGroup.allCases) { group in
                    chip(title: group.label, isSelected: selectedGroup == group) {
                        selectedGroup = (selectedGroup == group) ? nil : group
                    }
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private func chip(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(isSelected ? Theme.accent : Theme.card, in: Capsule())
                .foregroundStyle(isSelected ? .white : Theme.secondaryText)
        }
    }

    private var filteredExercises: [Exercise] {
        exercises.filter { exercise in
            let matchesGroup = selectedGroup == nil || exercise.muscleGroup == selectedGroup
            let matchesSearch = searchText.isEmpty
                || exercise.name.localizedCaseInsensitiveContains(searchText)
                || exercise.equipment.localizedCaseInsensitiveContains(searchText)
            return matchesGroup && matchesSearch
        }
    }
}

/// A single gallery card showing the exercise photo (or icon) and key info.
struct ExerciseCard: View {
    let exercise: Exercise

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                if let data = exercise.photoData, let image = UIImage(data: data) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Rectangle()
                        .fill(LinearGradient(colors: [Theme.cardElevated, Theme.card],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .overlay {
                            Image(systemName: exercise.muscleGroup.symbol)
                                .font(.system(size: 40))
                                .foregroundStyle(Theme.accentBright.opacity(0.8))
                        }
                }
            }
            .frame(height: 120)
            .frame(maxWidth: .infinity)
            .clipped()

            VStack(alignment: .leading, spacing: 6) {
                Text(exercise.name)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Theme.primaryText)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    TagPill(text: exercise.muscleGroup.label, tint: Theme.accentBright)
                }
                Text("\(exercise.sets) × \(exercise.reps)")
                    .font(.caption)
                    .foregroundStyle(Theme.secondaryText)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
    }
}

#Preview {
    NavigationStack {
        ExerciseLibraryView()
    }
    .modelContainer(PreviewData.container)
}
