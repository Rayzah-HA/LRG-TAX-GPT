import SwiftUI
import SwiftData
import UIKit

/// Tracks how suits fit over time — a tangible confidence metric for the
/// rebuild.
struct SuitFitView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \SuitFit.name) private var suits: [SuitFit]
    @State private var showingAdd = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if suits.isEmpty {
                    EmptyStateView(systemImage: "figure.dress.line.vertical.figure",
                                   title: "No suits yet",
                                   message: "Add a suit to track how it fits as you rebuild.")
                } else {
                    ForEach(suits) { suit in
                        NavigationLink {
                            SuitFitEditView(suit: suit)
                        } label: {
                            SuitFitRow(suit: suit)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Suit Fit")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingAdd) {
            SuitFitEditView()
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(suits[index]) }
        try? context.save()
    }
}

struct SuitFitRow: View {
    let suit: SuitFit

    var body: some View {
        HStack(spacing: 14) {
            if let data = suit.photoData, let image = UIImage(data: data) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 56, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Theme.cardElevated)
                    .frame(width: 56, height: 72)
                    .overlay {
                        Image(systemName: "figure.dress.line.vertical.figure")
                            .foregroundStyle(Theme.secondaryText)
                    }
            }
            VStack(alignment: .leading, spacing: 6) {
                Text(suit.name)
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                if !suit.brand.isEmpty {
                    Text(suit.brand)
                        .font(.subheadline)
                        .foregroundStyle(Theme.secondaryText)
                }
                HStack(spacing: 6) {
                    TagPill(text: suit.fitStatus.label, tint: suit.fitStatus.tint)
                    TagPill(text: "Confidence \(suit.confidenceRating)/10", tint: Theme.accentBright)
                }
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
        SuitFitView()
    }
    .modelContainer(PreviewData.container)
}
