import SwiftUI
import SwiftData

/// The core day-based flow: pick a day, see the exercises for it (pre-filled
/// from your weekly schedule), and check each one off as you do it.
/// Reporting (energy, reps, how you felt) is kept separate in the workout log.
struct TodayView: View {
    @Environment(\.modelContext) private var context
    @Query private var planItems: [WeeklyPlanItem]
    @Query private var dayExercises: [DayExercise]
    @Query(sort: \Exercise.name) private var library: [Exercise]

    @State private var selectedDate: Date = DateHelper.startOfDay(.now)
    @State private var showingAddExercise = false
    @State private var loggingDetails = false
    @State private var route: Route?

    /// Secondary screens reachable from the Today toolbar.
    private enum Route: Identifiable {
        case schedule, templates, history
        var id: Int { hashValue }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                WeekStrip(selectedDate: $selectedDate,
                          completionByDay: completionByDay)

                dayHeader

                if itemsForSelectedDay.isEmpty {
                    emptyDay
                } else {
                    checklist
                    logDetailsButton
                }
            }
            .padding()
        }
        .appBackground()
        .navigationTitle("Today")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAddExercise = true } label: { Image(systemName: "plus") }
            }
            ToolbarItem(placement: .topBarLeading) {
                Menu {
                    Button { route = .schedule } label: {
                        Label("Weekly Schedule", systemImage: "calendar")
                    }
                    Button { route = .templates } label: {
                        Label("Templates", systemImage: "list.bullet.rectangle")
                    }
                    Button { route = .history } label: {
                        Label("Workout History", systemImage: "clock.arrow.circlepath")
                    }
                    Divider()
                    Button { resetDayToSchedule() } label: {
                        Label("Reset Day to Schedule", systemImage: "arrow.counterclockwise")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .navigationDestination(item: $route) { route in
            switch route {
            case .schedule: WeeklyScheduleView()
            case .templates: TemplatesView()
            case .history: WorkoutLogView()
            }
        }
        .sheet(isPresented: $showingAddExercise) {
            AddDayExerciseSheet(library: library) { exercise in
                addExercise(named: exercise.name,
                            detail: "\(exercise.sets) × \(exercise.reps)")
            }
        }
        .sheet(isPresented: $loggingDetails) {
            WorkoutEditView(date: selectedDate, completedExerciseNames: completedNames)
        }
        .onAppear { materializeIfNeeded() }
        .onChange(of: selectedDate) { _, _ in materializeIfNeeded() }
    }

    // MARK: - Header

    private var dayHeader: some View {
        VStack(spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(relativeDayLabel)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(Theme.primaryText)
                    Text(selectedDate.formatted(.dateTime.weekday(.wide).month().day()))
                        .font(.subheadline)
                        .foregroundStyle(Theme.secondaryText)
                }
                Spacer()
                if !itemsForSelectedDay.isEmpty {
                    Text("\(completedCount)/\(itemsForSelectedDay.count)")
                        .font(.title3.weight(.bold))
                        .foregroundStyle(allDone ? .green : Theme.accentBright)
                        .contentTransition(.numericText())
                }
            }
            if !itemsForSelectedDay.isEmpty {
                ProgressBar(progress: progress, tint: allDone ? .green : Theme.accentBright)
                if allDone {
                    Label("Day complete — nice work.", systemImage: "checkmark.seal.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.green)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .cardStyle()
    }

    // MARK: - Checklist

    private var checklist: some View {
        VStack(spacing: 16) {
            ForEach(groupTitles, id: \.self) { group in
                VStack(alignment: .leading, spacing: 8) {
                    if !group.isEmpty {
                        Text(group.uppercased())
                            .font(.caption.weight(.bold))
                            .foregroundStyle(Theme.accentBright)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    VStack(spacing: 10) {
                        ForEach(items(in: group)) { item in
                            DayExerciseRow(
                                item: item,
                                exercise: library.first { $0.name == item.name },
                                onToggle: { toggle(item) },
                                onDelete: { delete(item) }
                            )
                        }
                    }
                }
            }
        }
    }

    private var logDetailsButton: some View {
        Button {
            loggingDetails = true
        } label: {
            Label("Log how it went (energy, reps, notes)", systemImage: "square.and.pencil")
                .font(.subheadline.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding()
                .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
        }
        .tint(Theme.accentBright)
    }

    private var emptyDay: some View {
        VStack(spacing: 14) {
            EmptyStateView(systemImage: "moon.zzz.fill",
                           title: "No workouts for this day",
                           message: "Rest day, or add something below.")
            Button {
                showingAddExercise = true
            } label: {
                Label("Add Exercise", systemImage: "plus")
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.accent)

            NavigationLink {
                WeeklyScheduleView()
            } label: {
                Label("Set Up Weekly Schedule", systemImage: "calendar")
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.bordered)
            .tint(Theme.accentBright)
        }
    }

    // MARK: - Derived data

    private var itemsForSelectedDay: [DayExercise] {
        dayExercises
            .filter { DateHelper.isSameDay($0.date, selectedDate) }
            .sorted { $0.order < $1.order }
    }

    private var groupTitles: [String] {
        var seen = Set<String>()
        var result: [String] = []
        for item in itemsForSelectedDay where !seen.contains(item.groupTitle) {
            seen.insert(item.groupTitle)
            result.append(item.groupTitle)
        }
        return result
    }

    private func items(in group: String) -> [DayExercise] {
        itemsForSelectedDay.filter { $0.groupTitle == group }
    }

    private var completedCount: Int { itemsForSelectedDay.filter(\.isCompleted).count }
    private var completedNames: [String] { itemsForSelectedDay.filter(\.isCompleted).map(\.name) }
    private var allDone: Bool { !itemsForSelectedDay.isEmpty && completedCount == itemsForSelectedDay.count }
    private var progress: Double {
        guard !itemsForSelectedDay.isEmpty else { return 0 }
        return Double(completedCount) / Double(itemsForSelectedDay.count)
    }

    private var relativeDayLabel: String {
        if DateHelper.isSameDay(selectedDate, .now) { return "Today" }
        let calendar = Calendar.current
        if let tomorrow = calendar.date(byAdding: .day, value: 1, to: DateHelper.startOfDay(.now)),
           DateHelper.isSameDay(selectedDate, tomorrow) { return "Tomorrow" }
        if let yesterday = calendar.date(byAdding: .day, value: -1, to: DateHelper.startOfDay(.now)),
           DateHelper.isSameDay(selectedDate, yesterday) { return "Yesterday" }
        return DateHelper.weekdayName(DateHelper.weekday(selectedDate))
    }

    /// Per-day completion fractions for the week strip dots (visible week only).
    private var completionByDay: [Date: Double] {
        var result: [Date: Double] = [:]
        for day in DateHelper.weekDays(containing: selectedDate) {
            let rows = dayExercises.filter { DateHelper.isSameDay($0.date, day) }
            let scheduled = planItems.contains { $0.weekday == DateHelper.weekday(day) }
            if rows.isEmpty {
                result[day] = scheduled ? 0 : -1   // -1 = nothing planned
            } else {
                let done = rows.filter(\.isCompleted).count
                result[day] = Double(done) / Double(rows.count)
            }
        }
        return result
    }

    // MARK: - Actions

    private func toggle(_ item: DayExercise) {
        withAnimation(.snappy) { item.toggle() }
        try? context.save()
    }

    private func delete(_ item: DayExercise) {
        context.delete(item)
        try? context.save()
    }

    private func addExercise(named name: String, detail: String) {
        let nextOrder = (itemsForSelectedDay.map(\.order).max() ?? -1) + 1
        let row = DayExercise(date: DateHelper.startOfDay(selectedDate),
                              name: name, groupTitle: "Added", detail: detail, order: nextOrder)
        context.insert(row)
        try? context.save()
    }

    /// Creates day rows from the weekly schedule the first time a day with a
    /// plan is opened. Days the user has already started (or edited) are left
    /// untouched.
    private func materializeIfNeeded() {
        let day = DateHelper.startOfDay(selectedDate)
        guard dayExercises.allSatisfy({ !DateHelper.isSameDay($0.date, day) }) else { return }
        insertScheduledRows(for: day)
    }

    /// Inserts day rows from the weekly schedule for `day` (no existence guard).
    private func insertScheduledRows(for day: Date) {
        let weekday = DateHelper.weekday(day)
        let scheduled = planItems.filter { $0.weekday == weekday }.sorted { $0.order < $1.order }
        guard !scheduled.isEmpty else { return }
        for item in scheduled {
            context.insert(DayExercise(date: day, name: item.name,
                                       groupTitle: item.groupTitle, detail: item.detail, order: item.order))
        }
        try? context.save()
    }

    /// Discards this day's rows and rebuilds them from the current schedule.
    private func resetDayToSchedule() {
        for item in itemsForSelectedDay { context.delete(item) }
        insertScheduledRows(for: DateHelper.startOfDay(selectedDate))
        try? context.save()
    }
}

#Preview {
    NavigationStack {
        TodayView()
    }
    .modelContainer(PreviewData.container)
}
