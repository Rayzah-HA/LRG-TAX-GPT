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

    /// Midnight at the start of the given day.
    static func startOfDay(_ date: Date) -> Date {
        Calendar.current.startOfDay(for: date)
    }

    /// Calendar weekday for a date: 1 = Sunday … 7 = Saturday.
    static func weekday(_ date: Date) -> Int {
        Calendar.current.component(.weekday, from: date)
    }

    /// True if both dates fall on the same calendar day.
    static func isSameDay(_ a: Date, _ b: Date) -> Bool {
        Calendar.current.isDate(a, inSameDayAs: b)
    }

    /// The seven days of the week containing `date`, respecting the locale's
    /// first weekday.
    static func weekDays(containing date: Date) -> [Date] {
        let calendar = Calendar.current
        guard let start = calendar.dateInterval(of: .weekOfYear, for: date)?.start else { return [] }
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    /// Weekday numbers (1–7) ordered by the locale's first weekday.
    static func orderedWeekdays() -> [Int] {
        let first = Calendar.current.firstWeekday
        return (0..<7).map { ((first - 1 + $0) % 7) + 1 }
    }

    /// Short symbol for a weekday number, e.g. 3 -> "Tue".
    static func shortWeekdaySymbol(_ weekday: Int) -> String {
        Calendar.current.shortWeekdaySymbols[(weekday - 1) % 7]
    }

    /// Full name for a weekday number, e.g. 3 -> "Tuesday".
    static func weekdayName(_ weekday: Int) -> String {
        Calendar.current.weekdaySymbols[(weekday - 1) % 7]
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
