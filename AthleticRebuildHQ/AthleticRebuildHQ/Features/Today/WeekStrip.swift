import SwiftUI

/// Horizontal week selector with prev/next week navigation and per-day status
/// dots. Large tap targets for one-handed use in the gym.
struct WeekStrip: View {
    @Binding var selectedDate: Date
    /// Per-day completion fraction. 1 = done, 0..<1 = partial, 0 = planned but
    /// untouched, -1 = nothing scheduled.
    let completionByDay: [Date: Double]

    private var days: [Date] { DateHelper.weekDays(containing: selectedDate) }

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Button { shiftWeek(-1) } label: {
                    Image(systemName: "chevron.left").padding(8)
                }
                Spacer()
                Text(monthTitle)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.secondaryText)
                Spacer()
                Button { shiftWeek(1) } label: {
                    Image(systemName: "chevron.right").padding(8)
                }
            }
            .tint(Theme.accentBright)

            HStack(spacing: 6) {
                ForEach(days, id: \.self) { day in
                    dayCell(day)
                }
            }
        }
    }

    private func dayCell(_ day: Date) -> some View {
        let isSelected = DateHelper.isSameDay(day, selectedDate)
        let isToday = DateHelper.isSameDay(day, .now)
        let fraction = completionByDay[day] ?? -1

        return Button {
            withAnimation(.snappy) { selectedDate = DateHelper.startOfDay(day) }
        } label: {
            VStack(spacing: 6) {
                Text(DateHelper.shortWeekdaySymbol(DateHelper.weekday(day)).prefix(3))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(isSelected ? .white : Theme.secondaryText)
                Text(day.formatted(.dateTime.day()))
                    .font(.headline)
                    .foregroundStyle(isSelected ? .white : Theme.primaryText)
                statusDot(fraction: fraction, isSelected: isSelected)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(isSelected ? Theme.accent : Theme.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(isToday && !isSelected ? Theme.accentBright : .clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func statusDot(fraction: Double, isSelected: Bool) -> some View {
        if fraction < 0 {
            // Nothing scheduled — keep the row visually quiet.
            Circle().fill(.clear).frame(width: 7, height: 7)
        } else if fraction >= 1 {
            Image(systemName: "checkmark")
                .font(.system(size: 9, weight: .black))
                .foregroundStyle(isSelected ? .white : .green)
                .frame(height: 7)
        } else {
            Circle()
                .fill(fraction > 0 ? (isSelected ? Color.white : Theme.accentBright)
                                   : (isSelected ? Color.white.opacity(0.5) : Theme.secondaryText.opacity(0.5)))
                .frame(width: 7, height: 7)
        }
    }

    private var monthTitle: String {
        selectedDate.formatted(.dateTime.month(.wide).year())
    }

    private func shiftWeek(_ direction: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: 7 * direction, to: selectedDate) {
            withAnimation(.snappy) { selectedDate = DateHelper.startOfDay(newDate) }
        }
    }
}
