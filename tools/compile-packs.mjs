import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';
import path from 'path';

const PACKAGE_ID = process.cwd();
const yaml = false;
const folders = false;

/**
 * Validate a document before compilation
 * @param {object} doc - The document to validate
 * @param {string} filename - The source filename
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDocument(doc, filename) {
  // Check for required _key field
  if (!doc._key) {
    console.warn(`  ⚠️  ${filename}: Missing _key field, skipping`);
    return false;
  }
  
  // Check for required _id field
  if (!doc._id || doc._id === null || doc._id === 'null') {
    console.warn(`  ⚠️  ${filename}: Invalid _id (${doc._id}), skipping`);
    return false;
  }
  
  // Check _id is 16 characters
  if (doc._id.length !== 16) {
    console.warn(`  ⚠️  ${filename}: _id must be 16 characters (got ${doc._id.length}: "${doc._id}"), skipping`);
    return false;
  }
  
  // Check _id is alphanumeric
  if (!/^[a-zA-Z0-9]{16}$/.test(doc._id)) {
    console.warn(`  ⚠️  ${filename}: _id must be alphanumeric (got "${doc._id}"), skipping`);
    return false;
  }
  
  // Check _key matches _id
  if (!doc._key.endsWith(doc._id)) {
    console.warn(`  ⚠️  ${filename}: _key doesn't match _id (key: ${doc._key}, id: ${doc._id}), skipping`);
    return false;
  }
  
  console.log(`  ✓ ${filename}: Valid (${doc._id})`);
  return true;
}

/**
 * Compile JSON source files to LevelDB packs
 * Based on official Foundry documentation
 */
async function compilePacks() {
  console.log('🔄 Compiling packs from JSON to LevelDB...\n');

  const packs = await fs.readdir('./src/packs');
  for (const pack of packs) {
    if (pack === '.gitattributes') continue;
    console.log(`📦 Packing: ${pack}`);
    
    // Validate all source files before compilation
    const sourcePath = path.join(PACKAGE_ID, 'src', 'packs', pack);
    const files = await fs.readdir(sourcePath);
    
    let validCount = 0;
    let invalidCount = 0;
    
    console.log(`  📄 Validating ${files.length} source files...`);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(sourcePath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const doc = JSON.parse(content);
        
        if (validateDocument(doc, file)) {
          validCount++;
        } else {
          invalidCount++;
        }
      } catch (error) {
        console.error(`  ❌ ${file}: Failed to parse - ${error.message}`);
        invalidCount++;
      }
    }
    
    console.log(`  📊 Validation: ${validCount} valid, ${invalidCount} invalid\n`);
    
    if (validCount === 0) {
      console.error(`  ❌ No valid documents found, skipping pack\n`);
      continue;
    }
    
    try {
      await compilePack(
        `${PACKAGE_ID}/src/packs/${pack}`,
        `${PACKAGE_ID}/packs/${pack}`,
        { 
          yaml, 
          recursive: folders, 
          log: true,
          transformEntry: async (doc, context) => {
            // Skip documents with invalid IDs during compilation
            if (!doc._id || doc._id === null || doc._id === 'null' || doc._id.length !== 16) {
              console.warn(`  🚫 Skipping entry with invalid _id: ${doc._id}`);
              return false; // Return false to skip this entry
            }
            return; // Return nothing to include this entry
          }
        }
      );
      console.log(`  ✅ Successfully packed ${pack}\n`);
    } catch (error) {
      console.error(`  ❌ Failed to pack ${pack}:`, error.message, '\n');
      console.error(error.stack);
    }
  }
  
  console.log('✨ Compilation complete!');
}

compilePacks().catch(console.error);
