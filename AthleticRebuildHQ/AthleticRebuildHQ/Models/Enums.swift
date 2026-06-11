import SwiftUI

// MARK: - Shared enums used across the app
//
// All enums are `String`-backed so SwiftData can persist them directly and so
// they survive schema changes gracefully. Each provides display helpers
// (label, SF Symbol, color) so views stay declarative and consistent.

/// The kind of training session being logged.
enum WorkoutType: String, Codable, CaseIterable, Identifiable {
    case upperBody = "Upper Body"
    case lowerBody = "Lower Body"
    case athleticFullBody = "Athletic Full Body"
    case recovery = "Recovery"
    case basketball = "Basketball"
    case boxingCardio = "Boxing/Cardio"
    case mobility = "Mobility"
    case outdoorActivity = "Outdoor Activity"

    var id: String { rawValue }
    var label: String { rawValue }

    var symbol: String {
        switch self {
        case .upperBody: "figure.strengthtraining.traditional"
        case .lowerBody: "figure.cross.training"
        case .athleticFullBody: "figure.highintensity.intervaltraining"
        case .recovery: "bed.double.fill"
        case .basketball: "basketball.fill"
        case .boxingCardio: "figure.boxing"
        case .mobility: "figure.flexibility"
        case .outdoorActivity: "figure.hiking"
        }
    }

    var tint: Color {
        switch self {
        case .upperBody: .orange
        case .lowerBody: .blue
        case .athleticFullBody: .red
        case .recovery: .green
        case .basketball: .yellow
        case .boxingCardio: .pink
        case .mobility: .teal
        case .outdoorActivity: .mint
        }
    }
}

/// Primary muscle group for an exercise — drives the library filter chips.
enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case back = "Back"
    case chest = "Chest"
    case shoulders = "Shoulders"
    case arms = "Arms"
    case legs = "Legs"
    case glutes = "Glutes"
    case core = "Core"
    case fullBody = "Full Body"
    case cardio = "Cardio"

    var id: String { rawValue }
    var label: String { rawValue }

    var symbol: String {
        switch self {
        case .back: "figure.strengthtraining.traditional"
        case .chest: "figure.arms.open"
        case .shoulders: "figure.boxing"
        case .arms: "dumbbell.fill"
        case .legs: "figure.walk"
        case .glutes: "figure.cross.training"
        case .core: "figure.core.training"
        case .fullBody: "figure.highintensity.intervaltraining"
        case .cardio: "heart.fill"
        }
    }
}

/// How a suit currently fits.
enum SuitFitStatus: String, Codable, CaseIterable, Identifiable {
    case tooTight = "Too Tight"
    case snug = "Snug"
    case perfect = "Perfect"
    case loose = "Loose"
    case needsTailoring = "Needs Tailoring"

    var id: String { rawValue }
    var label: String { rawValue }

    var tint: Color {
        switch self {
        case .tooTight: .red
        case .snug: .orange
        case .perfect: .green
        case .loose: .blue
        case .needsTailoring: .purple
        }
    }
}

/// Rough daily calorie self-assessment (no macro counting in the MVP).
enum CalorieEstimate: String, Codable, CaseIterable, Identifiable {
    case lightDeficit = "Light Deficit"
    case maintenance = "Maintenance"
    case overate = "Overate"
    case vacationMode = "Vacation Mode"

    var id: String { rawValue }
    var label: String { rawValue }

    var tint: Color {
        switch self {
        case .lightDeficit: .green
        case .maintenance: .blue
        case .overate: .orange
        case .vacationMode: .pink
        }
    }
}
