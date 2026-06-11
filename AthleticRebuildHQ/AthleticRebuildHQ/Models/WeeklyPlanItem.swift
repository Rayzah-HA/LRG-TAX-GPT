import Foundation
import SwiftData

/// One entry in the recurring weekly plan: "on this weekday, do this exercise".
/// The Today screen materializes these into `DayExercise` rows per calendar day.
@Model
final class WeeklyPlanItem {
    /// Calendar weekday: 1 = Sunday … 7 = Saturday.
    var weekday: Int
    var name: String
    /// Optional grouping header, e.g. the template/workout name it came from.
    var groupTitle: String
    /// Free-text prescription, e.g. "3 × 12" or "10 minutes".
    var detail: String
    var order: Int

    init(weekday: Int, name: String, groupTitle: String = "", detail: String = "", order: Int = 0) {
        self.weekday = weekday
        self.name = name
        self.groupTitle = groupTitle
        self.detail = detail
        self.order = order
    }
}
