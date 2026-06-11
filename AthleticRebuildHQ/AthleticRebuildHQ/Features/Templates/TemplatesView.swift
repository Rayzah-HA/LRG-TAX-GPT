import SwiftUI
import SwiftData

/// List of reusable workout templates. Tap to view the full plan and start a
/// session from it.
struct TemplatesView: View {
    @Query(sort: \WorkoutTemplate.createdAt) private var templates: [WorkoutTemplate]

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if templates.isEmpty {
                    EmptyStateView(systemImage: "list.bullet.rectangle",
                                   title: "No templates",
                                   message: "Your starter templates will appear here.")
                } else {
                    ForEach(templates) { template in
                        NavigationLink {
                            TemplateDetailView(template: template)
                        } label: {
                            TemplateRow(template: template)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Workout Templates")
    }
}

struct TemplateRow: View {
    let template: WorkoutTemplate

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(template.type.tint.opacity(0.2))
                    .frame(width: 56, height: 56)
                Image(systemName: template.type.symbol)
                    .font(.title2)
                    .foregroundStyle(template.type.tint)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(template.name)
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                Text(template.subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Theme.secondaryText)
                    .lineLimit(1)
                Text("\(template.items.count) movements")
                    .font(.caption)
                    .foregroundStyle(template.type.tint)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(Theme.secondaryText)
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .cardStyle()
    }
}

#Preview {
    NavigationStack {
        TemplatesView()
    }
    .modelContainer(PreviewData.container)
}
