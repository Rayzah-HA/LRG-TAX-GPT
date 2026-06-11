import Foundation
import SwiftData

/// A point-in-time body measurement / progress snapshot.
@Model
final class BodyProgress {
    var date: Date
    var weight: Double
    var waist: Double
    var chest: Double
    var arms: Double
    var thighs: Double
    /// Subjective 1–10 scores.
    var sleepScore: Int
    var stressScore: Int
    var energyScore: Int
    var notes: String
    @Attribute(.externalStorage) var frontPhotoData: Data?
    @Attribute(.externalStorage) var sidePhotoData: Data?
    @Attribute(.externalStorage) var backPhotoData: Data?

    init(
        date: Date = .now,
        weight: Double = 0,
        waist: Double = 0,
        chest: Double = 0,
        arms: Double = 0,
        thighs: Double = 0,
        sleepScore: Int = 5,
        stressScore: Int = 5,
        energyScore: Int = 5,
        notes: String = "",
        frontPhotoData: Data? = nil,
        sidePhotoData: Data? = nil,
        backPhotoData: Data? = nil
    ) {
        self.date = date
        self.weight = weight
        self.waist = waist
        self.chest = chest
        self.arms = arms
        self.thighs = thighs
        self.sleepScore = sleepScore
        self.stressScore = stressScore
        self.energyScore = energyScore
        self.notes = notes
        self.frontPhotoData = frontPhotoData
        self.sidePhotoData = sidePhotoData
        self.backPhotoData = backPhotoData
    }

    /// First available progress photo, used for thumbnails.
    var primaryPhotoData: Data? {
        frontPhotoData ?? sidePhotoData ?? backPhotoData
    }
}
