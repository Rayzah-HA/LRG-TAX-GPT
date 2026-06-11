import SwiftUI

// MARK: - Reusable building blocks for the dashboard and detail screens.

/// A compact metric tile for the dashboard grid.
struct StatTile: View {
    let title: String
    let value: String
    var caption: String? = nil
    let systemImage: String
    var tint: Color = Theme.accentBright

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: systemImage)
                    .font(.headline)
                    .foregroundStyle(tint)
                Spacer()
            }
            Text(value)
                .font(.title2.weight(.bold))
                .foregroundStyle(Theme.primaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(title)
                .font(.caption.weight(.medium))
                .foregroundStyle(Theme.secondaryText)
            if let caption {
                Text(caption)
                    .font(.caption2)
                    .foregroundStyle(tint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .cardStyle()
    }
}

/// A section header with an optional trailing action.
struct SectionHeader<Trailing: View>: View {
    let title: String
    @ViewBuilder var trailing: Trailing

    init(_ title: String, @ViewBuilder trailing: () -> Trailing = { EmptyView() }) {
        self.title = title
        self.trailing = trailing()
    }

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.title3.weight(.bold))
                .foregroundStyle(Theme.primaryText)
            Spacer()
            trailing
        }
    }
}

/// A labelled 1–10 stepper-style slider used across check-in forms.
struct ScoreSlider: View {
    let title: String
    @Binding var value: Int
    var range: ClosedRange<Int> = 1...10
    var tint: Color = Theme.accentBright

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .foregroundStyle(Theme.primaryText)
                Spacer()
                Text("\(value)")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(tint)
                    .contentTransition(.numericText())
            }
            Slider(
                value: Binding(
                    get: { Double(value) },
                    set: { value = Int($0.rounded()) }
                ),
                in: Double(range.lowerBound)...Double(range.upperBound),
                step: 1
            )
            .tint(tint)
        }
    }
}

/// A pill-shaped tag used for categories, statuses, and chips.
struct TagPill: View {
    let text: String
    var systemImage: String? = nil
    var tint: Color = Theme.accentBright

    var body: some View {
        HStack(spacing: 4) {
            if let systemImage {
                Image(systemName: systemImage)
            }
            Text(text)
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(tint.opacity(0.18), in: Capsule())
        .foregroundStyle(tint)
    }
}

/// A simple horizontal progress bar.
struct ProgressBar: View {
    /// 0.0 ... 1.0
    let progress: Double
    var tint: Color = Theme.accentBright

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.cardElevated)
                Capsule()
                    .fill(tint)
                    .frame(width: max(0, min(1, progress)) * geo.size.width)
            }
        }
        .frame(height: 10)
    }
}

/// An empty-state placeholder with an icon and message.
struct EmptyStateView: View {
    let systemImage: String
    let title: String
    var message: String = ""

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 44))
                .foregroundStyle(Theme.secondaryText)
            Text(title)
                .font(.headline)
                .foregroundStyle(Theme.primaryText)
            if !message.isEmpty {
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(Theme.secondaryText)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}
