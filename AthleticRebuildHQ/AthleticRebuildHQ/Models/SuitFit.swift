import Foundation
import SwiftData

/// Tracks how a particular suit fits over time as conditioning changes.
@Model
final class SuitFit {
    var name: String
    var brand: String
    /// Raw value of `SuitFitStatus`.
    var fitStatusRaw: String
    var waistFeel: String
    var jacketFeel: String
    /// Confidence wearing it, 1–10.
    var confidenceRating: Int
    var lastWorn: Date
    var goalFit: String
    @Attribute(.externalStorage) var photoData: Data?

    init(
        name: String,
        brand: String = "",
        fitStatus: SuitFitStatus = .snug,
        waistFeel: String = "",
        jacketFeel: String = "",
        confidenceRating: Int = 5,
        lastWorn: Date = .now,
        goalFit: String = "",
        photoData: Data? = nil
    ) {
        self.name = name
        self.brand = brand
        self.fitStatusRaw = fitStatus.rawValue
        self.waistFeel = waistFeel
        self.jacketFeel = jacketFeel
        self.confidenceRating = confidenceRating
        self.lastWorn = lastWorn
        self.goalFit = goalFit
        self.photoData = photoData
    }

    var fitStatus: SuitFitStatus {
        get { SuitFitStatus(rawValue: fitStatusRaw) ?? .snug }
        set { fitStatusRaw = newValue.rawValue }
    }
}
