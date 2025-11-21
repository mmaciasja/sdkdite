/**
 * Actor calculations for the sdkdite system
 */

import { DESCENT_THRESHOLDS, VIRTUE_LIMITS_BY_DESCENT } from "./constants.js";

/**
 * Calculate descent level based on total experience
 * @param {number} totalExperience - Total experience value
 * @returns {number} Descent level (0-3)
 */
export function calculateDescentLevel(totalExperience) {
  if (totalExperience >= DESCENT_THRESHOLDS.LEVEL_3) return 3;
  if (totalExperience >= DESCENT_THRESHOLDS.LEVEL_2) return 2;
  if (totalExperience >= DESCENT_THRESHOLDS.LEVEL_1) return 1;
  return 0;
}

/**
 * Get virtue limits for a specific descent level
 * @param {number} descentLevel - Descent level (0-3)
 * @returns {Object} Object with virtue type limits
 */
export function getVirtueLimits(descentLevel) {
  return VIRTUE_LIMITS_BY_DESCENT[descentLevel] || VIRTUE_LIMITS_BY_DESCENT[0];
}

/**
 * Count virtues by type from a collection of virtue items
 * @param {Array} virtueItems - Array of virtue items
 * @returns {Object} Object with counts per virtue type
 */
export function countVirtuesByType(virtueItems) {
  const counts = {
    Fragmented: 0,
    Kindred: 0,
    Harmonized: 0,
    Defect: 0
  };
  
  virtueItems.forEach(virtue => {
    const virtueType = virtue.system.type || "Fragmented";
    if (counts.hasOwnProperty(virtueType)) {
      counts[virtueType]++;
    }
  });
  
  return counts;
}

/**
 * Calculate virtue modifiers for all stats
 * Iterates through all virtue items and sums their modifiers
 * @param {Actor} actor - The actor
 * @returns {Object} Object with total modifiers per stat
 */
export function calculateVirtueModifiers(actor) {
  const virtues = actor.items.filter(item => item.type === "virtue");
  
  // Initialize modifiers object - will be dynamic based on what stats exist
  const modifiers = {};
  
  // Iterate through all virtues
  virtues.forEach(virtue => {
    const virtueModifiers = virtue.system.modifiers || {};
    
    // Sum up modifiers for each stat
    Object.keys(virtueModifiers).forEach(statName => {
      const modValue = virtueModifiers[statName] || 0;
      if (!modifiers[statName]) {
        modifiers[statName] = 0;
      }
      modifiers[statName] += modValue;
    });
  });
  
  return modifiers;
}

/**
 * Get region modifiers for a token
 * @param {Token} token - The token to check
 * @returns {Object} Object with region modifiers per stat
 */
export function getRegionModifiers(token) {
  if (!token) return {};
  
  const regionData = token.document.getFlag("sdkdite", "regionModifiers");
  return regionData?.modifiers || {};
}

/**
 * Calculate derived stats for an actor
 * @param {Actor} actor - The actor to calculate stats for
 */
export function calculateDerivedStats(actor) {
  const system = actor.system;
  
  // Get virtue modifiers (dynamic, scalable)
  const virtueModifiers = calculateVirtueModifiers(actor);
  
  // Get region modifiers from token if it exists
  const token = actor.token?.object || actor.getActiveTokens()[0];
  const regionModifiers = getRegionModifiers(token);
  
  // Combine virtue and region modifiers
  const allModifiers = {};
  const allStats = new Set([...Object.keys(virtueModifiers), ...Object.keys(regionModifiers)]);
  
  allStats.forEach(stat => {
    allModifiers[stat] = (virtueModifiers[stat] || 0) + (regionModifiers[stat] || 0);
  });
  
  // Get base stats from ancestry item
  let baseStats = {
    strength: 0,
    endurance: 0,
    dexterity: 0,
    charisma: 0,
    intelligence: 0
  };
  
  if (system.ancestryId) {
    const ancestryItem = actor.items.get(system.ancestryId);
    if (ancestryItem && ancestryItem.system.baseStats) {
      baseStats = {
        strength: ancestryItem.system.baseStats.strength || 0,
        endurance: ancestryItem.system.baseStats.endurance || 0,
        dexterity: ancestryItem.system.baseStats.dexterity || 0,
        charisma: ancestryItem.system.baseStats.charisma || 0,
        intelligence: ancestryItem.system.baseStats.intelligence || 0
      };
    }
  }
  
  // Calculate total value for primary stats: value = base (from ancestry) + mod + level + all modifiers
  const primaryStats = ['strength', 'constitution', 'dexterity', 'charisma', 'intelligence'];
  
  primaryStats.forEach(stat => {
    if (system[stat]) {
      // Use endurance for constitution
      const baseStat = stat === 'constitution' ? 'endurance' : stat;
      const base = baseStats[baseStat] || 0;
      const mod = system[stat].mod || 0;
      const level = system[stat].level || 0;
      const totalMod = allModifiers[stat] || 0;
      
      // Total value = base (from ancestry) + mod + level + all modifiers (virtue + region)
      system[stat].value = base + mod + level + totalMod;
    }
  });
  
  // Get circle stats bonuses
  let circleStats = {
    strike: 0,
    defense: 0,
    will: 0,
    insight: 0,
    speed: 0
  };
  
  if (system.circleId) {
    const circleItem = actor.items.get(system.circleId);
    if (circleItem && circleItem.system.stats) {
      circleStats = {
        strike: circleItem.system.stats.strike || 0,
        defense: circleItem.system.stats.defense || 0,
        will: circleItem.system.stats.will || 0,
        insight: circleItem.system.stats.insight || 0,
        speed: circleItem.system.stats.speed || 0
      };
    }
  }
  
  // Combat stats calculated from primary stats + mod + circle bonus + all modifiers
  const str = system.strength?.value || 0;
  const con = system.constitution?.value || 0;
  const dex = system.dexterity?.value || 0;
  const cha = system.charisma?.value || 0;
  const int = system.intelligence?.value || 0;

  // Strike = tenth of the strength + mod + circle bonus + all modifiers
  system.strike.value = Math.floor((str) / 10) + (system.strike.mod || 0) + circleStats.strike + (allModifiers.strike || 0);
  
  // Insight = tenth of intelligence, charisma, and dexterity + mod + circle bonus + all modifiers
  system.insight.value = Math.floor((int + cha + dex) / 10) + (system.insight.mod || 0) + circleStats.insight + (allModifiers.insight || 0);
  
  // Speed = fifth of dexterity + mod + circle bonus + all modifiers
  system.speed.value = Math.floor(dex / 5) + (system.speed.mod || 0) + circleStats.speed + (allModifiers.speed || 0);
  
  // Defense = Fifth of constitution + mod + circle bonus + all modifiers
  system.defense.value =  Math.floor(con / 5) + (system.defense.mod || 0) + circleStats.defense + (allModifiers.defense || 0);
  
  // Will = fifth of intelligence + mod + circle bonus + all modifiers
  system.will.value = Math.floor(int / 5) + (system.will.mod || 0) + circleStats.will + (allModifiers.will || 0);
  
  // Apply all modifiers to health and power if they exist
  if (system.health && allModifiers.health) {
    system.health.max = (system.health.max || 10) + allModifiers.health;
  }
  if (system.power && allModifiers.power) {
    system.power.max = (system.power.max || 5) + allModifiers.power;
  }
  
  return system;
}

/**
 * Calculate strike based on strength and dexterity
 * @param {Actor} actor - The actor
 */
export function calculateStrike(actor) {
  const system = actor.system;
  const str = system.strength?.value || 0;
  const dex = system.dexterity?.value || 0;
  
  // Strike = average of strength and dexterity
  system.strike.value = Math.floor((str + dex) / 2);
  
  return system.strike.value;
}

/**
 * Calculate insight based on intelligence and charisma
 * @param {Actor} actor - The actor
 */
export function calculateInsight(actor) {
  const system = actor.system;
  const int = system.intelligence?.value || 0;
  const cha = system.charisma?.value || 0;
  
  // Insight = average of intelligence and charisma
  system.insight.value = Math.floor((int + cha) / 2);
  
  return system.insight.value;
}

/**
 * Calculate speed based on dexterity
 * @param {Actor} actor - The actor
 */
export function calculateSpeed(actor) {
  const system = actor.system;
  const dex = system.dexterity?.value || 0;
  
  // Speed = dexterity
  system.speed.value = dex;
  
  return system.speed.value;
}

/**
 * Calculate defense based on constitution and dexterity
 * @param {Actor} actor - The actor
 */
export function calculateDefense(actor) {
  const system = actor.system;
  const con = system.constitution?.value || 0;
  const dex = system.dexterity?.value || 0;
  
  // Defense = 10 + constitution mod + dexterity mod
  const conMod = Math.floor((con - 10) / 2);
  const dexMod = Math.floor((dex - 10) / 2);
  
  system.defense.value = 10 + conMod + dexMod;
  
  return system.defense.value;
}

/**
 * Calculate will based on intelligence and charisma
 * @param {Actor} actor - The actor
 */
export function calculateWill(actor) {
  const system = actor.system;
  const int = system.intelligence?.value || 0;
  const cha = system.charisma?.value || 0;
  
  // Will = 10 + intelligence mod + charisma mod
  const intMod = Math.floor((int - 10) / 2);
  const chaMod = Math.floor((cha - 10) / 2);
  
  system.will.value = 10 + intMod + chaMod;
  
  return system.will.value;
}

/**
 * Calculate all derived stats at once
 * @param {Actor} actor - The actor
 */
export function calculateAllStats(actor) {
  calculateDerivedStats(actor);
  calculateStrike(actor);
  calculateInsight(actor);
  calculateSpeed(actor);
  calculateDefense(actor);
  calculateWill(actor);
  calculateUnusedExperience(actor);
  
  return actor.system;
}

/**
 * Calculate unused experience
 * Unused Experience = Experience - ((Strength + Constitution + Dexterity + Charisma + Intelligence) * 3)
 * @param {Actor} actor - The actor
 */
export function calculateUnusedExperience(actor) {
  const system = actor.system;
  
  const experience = system.experience?.value || 0;
  const str = system.strength?.level || 0;
  const con = system.constitution?.level || 0;
  const dex = system.dexterity?.level || 0;
  const cha = system.charisma?.level || 0;
  const int = system.intelligence?.level || 0;
  
  const totalStats = str + con + dex + cha + int;
  
  // Initialize experience object if it doesn't exist
  if (!system.experience) {
    system.experience = { value: 0, unused: 0 };
  }
  
  system.experience.unused = experience - (totalStats * 3);
  
  return system.experience.unused;
}
