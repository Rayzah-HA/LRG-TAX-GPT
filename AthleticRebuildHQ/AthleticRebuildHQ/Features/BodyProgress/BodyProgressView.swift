import SwiftUI
import SwiftData
import Charts
import UIKit

/// Body progress history: weight trend chart, measurement entries, and quick
/// access to the Suit Fit tracker.
struct BodyProgressView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \BodyProgress.date, order: .reverse) private var entries: [BodyProgress]
    @State private var showingAdd = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if entries.count >= 2 {
                    weightChart
                }

                if entries.isEmpty {
                    EmptyStateView(systemImage: "chart.line.uptrend.xyaxis",
                                   title: "No measurements yet",
                                   message: "Log weight, measurements, and progress photos to see your trend.")
                } else {
                    ForEach(entries) { entry in
                        NavigationLink {
                            BodyProgressEditView(entry: entry)
                        } label: {
                            BodyProgressRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Body Progress")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink {
                    SuitFitView()
                } label: {
                    Label("Suits", systemImage: "figure.dress.line.vertical.figure")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingAdd) {
            BodyProgressEditView()
        }
    }

    private var weightChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader("Weight Trend")
            Chart(entries.filter { $0.weight > 0 }.sorted { $0.date < $1.date }) { entry in
                LineMark(
                    x: .value("Date", entry.date),
                    y: .value("Weight", entry.weight)
                )
                .foregroundStyle(Theme.accentBright)
                .interpolationMethod(.catmullRom)
                PointMark(
                    x: .value("Date", entry.date),
                    y: .value("Weight", entry.weight)
                )
                .foregroundStyle(Theme.accentBright)
            }
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 200)
            .padding(16)
            .cardStyle()
        }
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(entries[index]) }
        try? context.save()
    }
}

struct BodyProgressRow: View {
    let entry: BodyProgress

    var body: some View {
        HStack(spacing: 14) {
            if let data = entry.primaryPhotoData, let image = UIImage(data: data) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 56, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Theme.cardElevated)
                    .frame(width: 56, height: 72)
                    .overlay { Image(systemName: "person.fill").foregroundStyle(Theme.secondaryText) }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.weight > 0 ? "\(entry.weight.clean) lb" : "No weight")
                    .font(.headline)
                    .foregroundStyle(Theme.primaryText)
                Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.subheadline)
                    .foregroundStyle(Theme.secondaryText)
                if entry.waist > 0 {
                    Text("Waist \(entry.waist.clean)\"")
                        .font(.caption)
                        .foregroundStyle(Theme.secondaryText)
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
        BodyProgressView()
    }
    .modelContainer(PreviewData.container)
}
