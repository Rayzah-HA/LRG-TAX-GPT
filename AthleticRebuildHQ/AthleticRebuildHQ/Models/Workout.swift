import Foundation
import SwiftData

/// A logged training session.
@Model
final class Workout {
    var date: Date
    /// Raw value of `WorkoutType`.
    var typeRaw: String
    var durationMinutes: Int
    /// Subjective energy during the session, 1–10.
    var energyLevel: Int
    var notes: String
    /// Names of exercises completed (selected from the library / template).
    var completedExercises: [String]
    var cardioCompleted: Bool
    var stretchingCompleted: Bool
    /// Optional reference back to the template this session was based on.
    var templateName: String

    init(
        date: Date = .now,
        type: WorkoutType = .upperBody,
        durationMinutes: Int = 45,
        energyLevel: Int = 7,
        notes: String = "",
        completedExercises: [String] = [],
        cardioCompleted: Bool = false,
        stretchingCompleted: Bool = false,
        templateName: String = ""
    ) {
        self.date = date
        self.typeRaw = type.rawValue
        self.durationMinutes = durationMinutes
        self.energyLevel = energyLevel
        self.notes = notes
        self.completedExercises = completedExercises
        self.cardioCompleted = cardioCompleted
        self.stretchingCompleted = stretchingCompleted
        self.templateName = templateName
    }

    var type: WorkoutType {
        get { WorkoutType(rawValue: typeRaw) ?? .upperBody }
        set { typeRaw = newValue.rawValue }
    }
}
