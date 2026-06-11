import Foundation

/// Small date utilities shared across features.
enum DateHelper {
    /// True if `date` falls within the current calendar week (locale-aware).
    static func isInCurrentWeek(_ date: Date) -> Bool {
        Calendar.current.isDate(date, equalTo: .now, toGranularity: .weekOfYear)
    }

    /// Start of the current week, used for filtering.
    static var startOfCurrentWeek: Date {
        let calendar = Calendar.current
        return calendar.dateInterval(of: .weekOfYear, for: .now)?.start ?? .now
    }
}

extension Double {
    /// Formats a measurement without a trailing ".0" but keeping decimals when
    /// present (e.g. 201 -> "201", 35.5 -> "35.5").
    var clean: String {
        if self == rounded() {
            return String(format: "%.0f", self)
        }
        return String(format: "%.1f", self)
    }
}
