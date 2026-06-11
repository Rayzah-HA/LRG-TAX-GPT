import Foundation
import SwiftData

/// A lightweight daily nutrition habit check-in (no calorie counting).
@Model
final class NutritionEntry {
    var date: Date
    var proteinGoalHit: Bool
    var waterGoalHit: Bool
    /// Servings of fruits/vegetables.
    var fruitsVegetables: Int
    var fastFood: Bool
    var alcohol: Bool
    /// Raw value of `CalorieEstimate`.
    var calorieEstimateRaw: String
    /// Subjective hunger, 1–10.
    var hungerLevel: Int
    var notes: String

    init(
        date: Date = .now,
        proteinGoalHit: Bool = false,
        waterGoalHit: Bool = false,
        fruitsVegetables: Int = 0,
        fastFood: Bool = false,
        alcohol: Bool = false,
        calorieEstimate: CalorieEstimate = .maintenance,
        hungerLevel: Int = 5,
        notes: String = ""
    ) {
        self.date = date
        self.proteinGoalHit = proteinGoalHit
        self.waterGoalHit = waterGoalHit
        self.fruitsVegetables = fruitsVegetables
        self.fastFood = fastFood
        self.alcohol = alcohol
        self.calorieEstimateRaw = calorieEstimate.rawValue
        self.hungerLevel = hungerLevel
        self.notes = notes
    }

    var calorieEstimate: CalorieEstimate {
        get { CalorieEstimate(rawValue: calorieEstimateRaw) ?? .maintenance }
        set { calorieEstimateRaw = newValue.rawValue }
    }
}
