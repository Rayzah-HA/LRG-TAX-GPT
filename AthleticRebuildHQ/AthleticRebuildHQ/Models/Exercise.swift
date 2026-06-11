import Foundation
import SwiftData

/// A single exercise in the library. Holds prescription (sets/reps/weight),
/// coaching (form cue), and a photo so Larry can remember what each
/// machine/movement looks like in his gym overseas.
@Model
final class Exercise {
    var name: String
    /// Stored as the raw value of `MuscleGroup` for forward-compatibility.
    var muscleGroupRaw: String
    var equipment: String
    var sets: Int
    var reps: Int
    var startingWeight: Double
    var currentWeight: Double
    var formCue: String
    var notes: String
    /// Optional demo video link (e.g. YouTube). Empty string when unset.
    var demoVideoURL: String
    /// Photo of the machine/exercise. Stored outside the main store for size.
    @Attribute(.externalStorage) var photoData: Data?
    var createdAt: Date

    init(
        name: String,
        muscleGroup: MuscleGroup,
        equipment: String,
        sets: Int = 3,
        reps: Int = 12,
        startingWeight: Double = 0,
        currentWeight: Double = 0,
        formCue: String = "",
        notes: String = "",
        demoVideoURL: String = "",
        photoData: Data? = nil,
        createdAt: Date = .now
    ) {
        self.name = name
        self.muscleGroupRaw = muscleGroup.rawValue
        self.equipment = equipment
        self.sets = sets
        self.reps = reps
        self.startingWeight = startingWeight
        self.currentWeight = currentWeight
        self.formCue = formCue
        self.notes = notes
        self.demoVideoURL = demoVideoURL
        self.photoData = photoData
        self.createdAt = createdAt
    }

    /// Typed accessor for the persisted muscle group raw value.
    var muscleGroup: MuscleGroup {
        get { MuscleGroup(rawValue: muscleGroupRaw) ?? .fullBody }
        set { muscleGroupRaw = newValue.rawValue }
    }

    /// Change in weight since starting, in the user's chosen unit.
    var weightDelta: Double { currentWeight - startingWeight }
}
