#!/usr/bin/env node

/**
 * ID Generator for FoundryVTT System
 * Generates 16-character IDs with the following structure:
 * - 3 chars: Order prefix (optional, use "000" if not needed)
 * - 3 chars: Type code (act, itm, scn, etc.)
 * - 3 chars: Subtype code (vpc, vrt, skl, etc.)
 * - 7 chars: Random characters to avoid collisions
 */

const TYPE_CODES = {
  actor: 'act',
  item: 'itm',
  scene: 'scn',
  journal: 'jnl',
  macro: 'mac',
  playlist: 'pls',
  table: 'tbl',
  card: 'crd'
};

const ITEM_SUBTYPE_CODES = {
  'playable-character': 'vpc',
  ancestry: 'anc',
  circle: 'crc',
  skill: 'skl',
  expertise: 'exp',
  virtue: 'vrt'
};

const ACTOR_SUBTYPE_CODES = {
  'playable-character': 'vpc',
  npc: 'npc',
  monster: 'mon'
};

/**
 * Generates a random alphanumeric string of specified length
 * @param {number} length - Length of random string
 * @returns {string}
 */
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a valid 16-character ID
 * @param {Object} options
 * @param {string} options.type - Entity type (actor, item, etc.)
 * @param {string} options.subtype - Entity subtype (virtue, skill, etc.)
 * @param {string|number} [options.order] - Optional order prefix (3 digits)
 * @returns {string} 16-character ID
 */
function generateId({ type, subtype, order = '000' }) {
  // Validate inputs
  const typeCode = TYPE_CODES[type];
  if (!typeCode) {
    throw new Error(`Invalid type: ${type}. Valid types: ${Object.keys(TYPE_CODES).join(', ')}`);
  }

  let subtypeCode;
  if (type === 'item') {
    subtypeCode = ITEM_SUBTYPE_CODES[subtype];
  } else if (type === 'actor') {
    subtypeCode = ACTOR_SUBTYPE_CODES[subtype];
  } else {
    subtypeCode = subtype.substring(0, 3).toLowerCase();
  }

  if (!subtypeCode) {
    throw new Error(`Invalid subtype: ${subtype} for type ${type}`);
  }

  // Ensure order is 3 characters
  const orderStr = String(order).padStart(3, '0').substring(0, 3);
  
  // Generate random suffix
  const randomSuffix = generateRandomString(7);

  // Combine to create 16-char ID
  const id = `${orderStr}${typeCode}${subtypeCode}${randomSuffix}`;
  
  if (id.length !== 16) {
    throw new Error(`Generated ID is not 16 characters: ${id} (${id.length} chars)`);
  }

  return id;
}

/**
 * CLI handler
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node generate-id.mjs <type> <subtype> [order]

Arguments:
  type      Entity type (actor, item, scene, etc.)
  subtype   Entity subtype (virtue, skill, ancestry, etc.)
  order     Optional order number (default: 000)

Valid Types:
  ${Object.keys(TYPE_CODES).join(', ')}

Valid Item Subtypes:
  ${Object.keys(ITEM_SUBTYPE_CODES).join(', ')}

Valid Actor Subtypes:
  ${Object.keys(ACTOR_SUBTYPE_CODES).join(', ')}

Examples:
  node generate-id.mjs item virtue
  node generate-id.mjs item virtue 001
  node generate-id.mjs item ancestry
  node generate-id.mjs actor playable-character

Batch Generation:
  node generate-id.mjs --batch item virtue 5
  node generate-id.mjs --batch item skill 10 --start 1
`);
    return;
  }

  // Batch mode
  if (args[0] === '--batch') {
    const type = args[1];
    const subtype = args[2];
    const count = parseInt(args[3]) || 1;
    const startOrder = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1]) : 0;

    console.log(`Generating ${count} IDs for ${type}/${subtype}:\n`);
    
    for (let i = 0; i < count; i++) {
      const order = startOrder > 0 ? (startOrder + i) : undefined;
      const id = generateId({ type, subtype, order });
      console.log(id);
    }
    return;
  }

  // Single ID generation
  const type = args[0];
  const subtype = args[1];
  const order = args[2];

  try {
    const id = generateId({ type, subtype, order });
    console.log(id);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:')) {
  main();
}

export { generateId, TYPE_CODES, ITEM_SUBTYPE_CODES, ACTOR_SUBTYPE_CODES };
