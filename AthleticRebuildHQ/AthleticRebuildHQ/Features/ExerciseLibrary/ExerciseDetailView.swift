import SwiftUI
import SwiftData
import UIKit

/// Read-only detail for an exercise, with a quick way to bump the working
/// weight and an Edit entry point.
struct ExerciseDetailView: View {
    @Bindable var exercise: Exercise
    @State private var showingEdit = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                photo

                VStack(alignment: .leading, spacing: 8) {
                    Text(exercise.name)
                        .font(.title.weight(.bold))
                        .foregroundStyle(Theme.primaryText)
                    HStack {
                        TagPill(text: exercise.muscleGroup.label, systemImage: exercise.muscleGroup.symbol)
                        if !exercise.equipment.isEmpty {
                            TagPill(text: exercise.equipment, systemImage: "wrench.and.screwdriver.fill", tint: .orange)
                        }
                    }
                }

                prescription
                weightTracker

                if !exercise.formCue.isEmpty {
                    infoBlock(title: "Form Cue", systemImage: "lightbulb.fill", text: exercise.formCue, tint: .yellow)
                }
                if !exercise.notes.isEmpty {
                    infoBlock(title: "Notes", systemImage: "note.text", text: exercise.notes, tint: Theme.accentBright)
                }
                if let url = videoURL {
                    Link(destination: url) {
                        Label("Watch Demo Video", systemImage: "play.rectangle.fill")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cornerRadius))
                    }
                    .tint(Theme.accentBright)
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Exercise")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { showingEdit = true }
            }
        }
        .sheet(isPresented: $showingEdit) {
            ExerciseEditView(exercise: exercise)
        }
    }

    private var photo: some View {
        Group {
            if let data = exercise.photoData, let image = UIImage(data: data) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(height: 240)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous)
                    .fill(Theme.cardElevated)
                    .frame(height: 240)
                    .overlay {
                        Image(systemName: exercise.muscleGroup.symbol)
                            .font(.system(size: 60))
                            .foregroundStyle(Theme.accentBright.opacity(0.8))
                    }
            }
        }
    }

    private var prescription: some View {
        HStack(spacing: 12) {
            metric("Sets", "\(exercise.sets)")
            metric("Reps", "\(exercise.reps)")
        }
    }

    private var weightTracker: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader("Working Weight")
            HStack(spacing: 12) {
                metric("Starting", exercise.startingWeight > 0 ? "\(exercise.startingWeight.clean)" : "—")
                metric("Current", exercise.currentWeight > 0 ? "\(exercise.currentWeight.clean)" : "—",
                       tint: Theme.accentBright)
            }
            // Quick-adjust buttons for minimal typing in the gym.
            HStack(spacing: 12) {
                Button {
                    exercise.currentWeight = max(0, exercise.currentWeight - 5)
                } label: {
                    Label("-5", systemImage: "minus")
                        .frame(maxWidth: .infinity)
                }
                Button {
                    exercise.currentWeight += 5
                } label: {
                    Label("+5", systemImage: "plus")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.accent)

            if exercise.weightDelta != 0 && exercise.startingWeight > 0 {
                Text(exercise.weightDelta > 0
                     ? "↑ \(exercise.weightDelta.clean) since start"
                     : "↓ \(abs(exercise.weightDelta).clean) since start")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(exercise.weightDelta > 0 ? .green : .orange)
            }
        }
    }

    private func metric(_ title: String, _ value: String, tint: Color = Theme.primaryText) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.weight(.bold))
                .foregroundStyle(tint)
            Text(title)
                .font(.caption)
                .foregroundStyle(Theme.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .cardStyle()
    }

    private func infoBlock(title: String, systemImage: String, text: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: systemImage)
                .font(.headline)
                .foregroundStyle(tint)
            Text(text)
                .font(.body)
                .foregroundStyle(Theme.primaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .cardStyle()
    }

    private var videoURL: URL? {
        guard !exercise.demoVideoURL.isEmpty else { return nil }
        return URL(string: exercise.demoVideoURL)
    }
}

#Preview {
    NavigationStack {
        ExerciseDetailView(exercise: SeedData.seedExercises()[0])
    }
    .modelContainer(PreviewData.container)
}
