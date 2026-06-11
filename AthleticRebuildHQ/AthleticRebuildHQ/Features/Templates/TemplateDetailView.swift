import SwiftUI
import SwiftData

/// Shows a template's full plan grouped by section, with a button to log a
/// workout pre-filled from it.
struct TemplateDetailView: View {
    let template: WorkoutTemplate
    @State private var loggingWorkout = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                ForEach(template.sections, id: \.self) { section in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(section.uppercased())
                            .font(.caption.weight(.bold))
                            .foregroundStyle(template.type.tint)
                        VStack(spacing: 0) {
                            ForEach(Array(template.items(in: section).enumerated()), id: \.element.id) { index, item in
                                HStack {
                                    Text(item.name)
                                        .foregroundStyle(Theme.primaryText)
                                    Spacer()
                                    Text(item.detail)
                                        .font(.subheadline)
                                        .foregroundStyle(Theme.secondaryText)
                                }
                                .padding(.vertical, 12)
                                if index < template.items(in: section).count - 1 {
                                    Divider().overlay(Theme.cardElevated)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .cardStyle()
                    }
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle(template.name)
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            Button {
                loggingWorkout = true
            } label: {
                Label("Start This Workout", systemImage: "play.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.accent)
            .padding()
            .background(.ultraThinMaterial)
        }
        .sheet(isPresented: $loggingWorkout) {
            WorkoutEditView(template: template)
        }
    }

    private var header: some View {
        HStack(spacing: 14) {
            Image(systemName: template.type.symbol)
                .font(.largeTitle)
                .foregroundStyle(template.type.tint)
            VStack(alignment: .leading, spacing: 4) {
                Text(template.subtitle)
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                TagPill(text: template.type.label, tint: template.type.tint)
            }
            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }
}

#Preview {
    NavigationStack {
        TemplateDetailView(template: SeedData.seedTemplates()[2])
    }
    .modelContainer(PreviewData.container)
}
