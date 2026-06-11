import SwiftUI

/// Central place for the app's dark, masculine athletic look.
enum Theme {
    // Brand accent — a strong athletic green/blue.
    static let accent = Color(red: 0.00, green: 0.52, blue: 0.30)
    static let accentBright = Color(red: 0.15, green: 0.80, blue: 0.45)

    // Backgrounds (dark-mode first).
    static let background = Color(red: 0.05, green: 0.06, blue: 0.08)
    static let card = Color(red: 0.11, green: 0.12, blue: 0.15)
    static let cardElevated = Color(red: 0.15, green: 0.16, blue: 0.20)

    // Text.
    static let primaryText = Color.white
    static let secondaryText = Color.white.opacity(0.6)

    // Standard corner radius for cards / tiles.
    static let cornerRadius: CGFloat = 18
}

extension View {
    /// Standard card styling: rounded, elevated surface on the dark background.
    func cardStyle() -> some View {
        self
            .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
    }

    /// Applies the app background and ensures dark mode.
    func appBackground() -> some View {
        self
            .background(Theme.background.ignoresSafeArea())
            .preferredColorScheme(.dark)
    }
}
