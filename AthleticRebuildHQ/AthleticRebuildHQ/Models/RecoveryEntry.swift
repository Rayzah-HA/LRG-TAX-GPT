import Foundation
import SwiftData

/// Daily recovery check-in. The dashboard's "recovery score" is derived from
/// the most recent entry.
@Model
final class RecoveryEntry {
    var date: Date
    var sleepHours: Double
    /// 1–10 subjective scores.
    var soreness: Int
    var stress: Int
    var motivation: Int
    var hydration: Int
    var mobilityWork: Bool
    var notes: String

    init(
        date: Date = .now,
        sleepHours: Double = 7,
        soreness: Int = 5,
        stress: Int = 5,
        motivation: Int = 5,
        hydration: Int = 5,
        mobilityWork: Bool = false,
        notes: String = ""
    ) {
        self.date = date
        self.sleepHours = sleepHours
        self.soreness = soreness
        self.stress = stress
        self.motivation = motivation
        self.hydration = hydration
        self.mobilityWork = mobilityWork
        self.notes = notes
    }

    /// A 0–100 recovery score blending sleep, low soreness, low stress,
    /// motivation, and hydration. Used on the dashboard.
    var recoveryScore: Int {
        // Normalize sleep to a 1–10 feel (8h ≈ 10).
        let sleepScore = min(sleepHours / 8.0 * 10.0, 10.0)
        // Soreness and stress are negatives, so invert them.
        let invertedSoreness = Double(11 - soreness)
        let invertedStress = Double(11 - stress)
        let components = [
            sleepScore,
            invertedSoreness,
            invertedStress,
            Double(motivation),
            Double(hydration)
        ]
        let average = components.reduce(0, +) / Double(components.count)
        return Int((average / 10.0 * 100.0).rounded())
    }
}
