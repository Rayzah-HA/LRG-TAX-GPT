import SwiftUI
import UIKit

/// A single tappable checklist row for the Today screen. The whole row toggles
/// completion (big tap target); the trailing thumbnail/info opens the exercise
/// detail (photo, form cue). Long-press for delete.
struct DayExerciseRow: View {
    let item: DayExercise
    /// Matching library exercise, if any, for the photo and detail link.
    let exercise: Exercise?
    let onToggle: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 14) {
            Button(action: onToggle) {
                HStack(spacing: 14) {
                    Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 26))
                        .foregroundStyle(item.isCompleted ? .green : Theme.secondaryText)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.name)
                            .font(.headline)
                            .foregroundStyle(item.isCompleted ? Theme.secondaryText : Theme.primaryText)
                            .strikethrough(item.isCompleted, color: Theme.secondaryText)
                        if !item.detail.isEmpty {
                            Text(item.detail)
                                .font(.subheadline)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if let exercise {
                NavigationLink {
                    ExerciseDetailView(exercise: exercise)
                } label: {
                    thumbnail(for: exercise)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous)
                .fill(item.isCompleted ? Theme.card.opacity(0.6) : Theme.card)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous)
                .strokeBorder(item.isCompleted ? Color.green.opacity(0.4) : .clear, lineWidth: 1)
        )
        .contextMenu {
            Button(role: .destructive, action: onDelete) {
                Label("Remove from this day", systemImage: "trash")
            }
        }
    }

    @ViewBuilder
    private func thumbnail(for exercise: Exercise) -> some View {
        if let data = exercise.photoData, let image = UIImage(data: data) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        } else {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Theme.cardElevated)
                    .frame(width: 48, height: 48)
                Image(systemName: "info.circle")
                    .foregroundStyle(Theme.secondaryText)
            }
        }
    }
}
