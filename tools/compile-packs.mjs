import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';

const MODULE_ID = process.cwd();
const yaml = false;

/**
 * Compile JSON source files to LevelDB packs
 * This script converts editable JSON files to Foundry-compatible packs
 */
async function compilePacks() {
  console.log('🔄 Compiling packs from JSON to LevelDB...\n');

  let packs;
  try {
    packs = await fs.readdir('./packs/_source');
  } catch (error) {
    console.error('❌ Error: packs/_source directory not found');
    console.error('   Make sure you have source files in packs/_source/');
    process.exit(1);
  }
  
  for (const pack of packs) {
    // Skip hidden files and non-directories
    if (pack === '.gitattributes' || pack.startsWith('.')) continue;
    
    // Verify it's a directory
    const stats = await fs.stat(`./packs/_source/${pack}`);
    if (!stats.isDirectory()) continue;
    
    console.log(`📦 Packing: ${pack}`);
    
    try {
      await compilePack(
        `${MODULE_ID}/packs/_source/${pack}`, 
        `${MODULE_ID}/packs/${pack}`, 
        { yaml }
      );
      console.log(`  ✅ Successfully packed ${pack}\n`);
    } catch (error) {
      console.error(`  ❌ Failed to pack ${pack}:`, error.message, '\n');
    }
  }
  
  console.log('✨ Compilation complete!');
}

compilePacks().catch(console.error);
