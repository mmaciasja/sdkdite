export const ATTRIBUTE_TYPES = ["String", "Number", "Boolean", "Formula", "Resource"];

/**
 * Virtue limits by descent level
 * Descent 0: 2 Fragmented, 1 Kindred, 0 Harmonized, 0 Defect
 * Descent 1: 3 Fragmented, 2 Kindred, 0 Harmonized, 0 Defect
 * Descent 2: 3 Fragmented, 3 Kindred, 1 Harmonized, 0 Defect
 * Descent 3: 3 Fragmented, 3 Kindred, 3 Harmonized, 0 Defect
 */
export const VIRTUE_LIMITS_BY_DESCENT = {
  0: { Fragmented: 2, Kindred: 1, Harmonized: 0, Defect: 0 },
  1: { Fragmented: 3, Kindred: 2, Harmonized: 0, Defect: 0 },
  2: { Fragmented: 3, Kindred: 3, Harmonized: 1, Defect: 0 },
  3: { Fragmented: 3, Kindred: 3, Harmonized: 3, Defect: 0 }
};

/**
 * Experience thresholds for descent levels
 */
export const DESCENT_THRESHOLDS = {
  LEVEL_1: 75,
  LEVEL_2: 150,
  LEVEL_3: 250
};