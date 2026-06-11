import Foundation
import SwiftData

/// A reusable workout plan made up of grouped items (warmup, machines,
/// dumbbells, core, finisher, …).
@Model
final class WorkoutTemplate {
    var name: String
    var subtitle: String
    /// Raw value of the `WorkoutType` this template maps to when logged.
    var typeRaw: String
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \TemplateItem.template)
    var items: [TemplateItem]

    init(
        name: String,
        subtitle: String = "",
        type: WorkoutType = .upperBody,
        items: [TemplateItem] = [],
        createdAt: Date = .now
    ) {
        self.name = name
        self.subtitle = subtitle
        self.typeRaw = type.rawValue
        self.items = items
        self.createdAt = createdAt
    }

    var type: WorkoutType {
        get { WorkoutType(rawValue: typeRaw) ?? .upperBody }
        set { typeRaw = newValue.rawValue }
    }

    /// Items sorted by their stored order, grouped into ordered sections.
    var sortedItems: [TemplateItem] {
        items.sorted { $0.order < $1.order }
    }

    /// Section titles in display order, de-duplicated.
    var sections: [String] {
        var seen = Set<String>()
        var result: [String] = []
        for item in sortedItems where !seen.contains(item.section) {
            seen.insert(item.section)
            result.append(item.section)
        }
        return result
    }

    func items(in section: String) -> [TemplateItem] {
        sortedItems.filter { $0.section == section }
    }
}

/// One line within a template, e.g. "Lat Pulldown — 3 sets of 12".
@Model
final class TemplateItem {
    /// Section heading the item belongs to, e.g. "Machines 3 sets of 12".
    var section: String
    var name: String
    /// Free-text prescription, e.g. "3 sets of 12" or "10 minutes".
    var detail: String
    var order: Int
    var template: WorkoutTemplate?

    init(section: String, name: String, detail: String = "", order: Int = 0) {
        self.section = section
        self.name = name
        self.detail = detail
        self.order = order
    }
}
