/**
 * Actor calculations for the sdkdite system
 */

/**
 * Calculate derived stats for an actor
 * @param {Actor} actor - The actor to calculate stats for
 */
export function calculateDerivedStats(actor) {
  const system = actor.system;
  
  // Calculate total value for all stats: value = 5 (base) + mod + level
  const allStats = ['strength', 'constitution', 'dexterity', 'charisma', 'intelligence', 'strike', 'insight', 'speed', 'defense', 'will'];
  
  allStats.forEach(stat => {
    if (system[stat]) {
      const base = 5; // Fixed base value
      const mod = system[stat].mod || 0;
      const level = system[stat].level || 0;
      
      // Total value = 5 + mod + level
      system[stat].value = base + mod + level;
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
