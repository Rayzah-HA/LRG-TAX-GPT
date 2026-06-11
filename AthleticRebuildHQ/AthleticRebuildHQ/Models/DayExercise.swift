import Foundation
import SwiftData

/// A single exercise scheduled on a specific calendar day, with a checkbox.
/// These are created ("materialized") from the weekly plan when you open a day,
/// and can then be checked off, added to, or removed for that day only — so
/// per-day edits never change your recurring schedule.
@Model
final class DayExercise {
    /// Normalized to the start of the day it belongs to.
    var date: Date
    var name: String
    /// Optional grouping header (the workout/template this came from).
    var groupTitle: String
    var detail: String
    var order: Int
    var isCompleted: Bool
    var completedAt: Date?

    init(
        date: Date,
        name: String,
        groupTitle: String = "",
        detail: String = "",
        order: Int = 0,
        isCompleted: Bool = false,
        completedAt: Date? = nil
    ) {
        self.date = date
        self.name = name
        self.groupTitle = groupTitle
        self.detail = detail
        self.order = order
        self.isCompleted = isCompleted
        self.completedAt = completedAt
    }

    func toggle() {
        isCompleted.toggle()
        completedAt = isCompleted ? .now : nil
    }
}
