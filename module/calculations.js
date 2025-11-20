/**
 * Actor calculations for the sdkdite system
 */

/**
 * Calculate derived stats for an actor
 * @param {Actor} actor - The actor to calculate stats for
 */
export function calculateDerivedStats(actor) {
  const system = actor.system;
  
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
  
  // Calculate total value for primary stats: value = base (from ancestry) + mod + level
  const primaryStats = ['strength', 'constitution', 'dexterity', 'charisma', 'intelligence'];
  
  primaryStats.forEach(stat => {
    if (system[stat]) {
      // Use endurance for constitution
      const baseStat = stat === 'constitution' ? 'endurance' : stat;
      const base = baseStats[baseStat] || 0;
      const mod = system[stat].mod || 0;
      const level = system[stat].level || 0;
      
      // Total value = base (from ancestry) + mod + level
      system[stat].value = base + mod + level;
    }
  });
  
  // Combat stats still use fixed base of 5 + mod (no level)
  const combatStats = ['strike', 'insight', 'speed', 'defense', 'will'];
  
  combatStats.forEach(stat => {
    if (system[stat]) {
      const base = 5;
      const mod = system[stat].mod || 0;
      
      // Total value = 5 + mod
      system[stat].value = base + mod;
    }
  });
  
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
