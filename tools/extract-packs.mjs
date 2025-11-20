import { extractPack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';
import path from 'path';

const MODULE_ID = process.cwd();
const yaml = false;

/**
 * Extract LevelDB packs to JSON source files
 * This script converts compiled packs back to editable JSON
 */
async function extractPacks() {
  console.log('🔄 Extracting packs from LevelDB to JSON...\n');

  const packs = await fs.readdir('./packs');
  
  for (const pack of packs) {
    // Skip non-pack directories and files
    if (pack === '.gitattributes' || pack === '_source') continue;
    
    // Verify it's a directory
    const stats = await fs.stat(`./packs/${pack}`);
    if (!stats.isDirectory()) continue;
    
    console.log(`📦 Unpacking: ${pack}`);
    const directory = `./packs/_source/${pack}`;
    
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(directory, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`  ❌ Error creating directory ${pack}:`, error.message);
      }
    }
    
    try {
      await extractPack(
        `${MODULE_ID}/packs/${pack}`, 
        `${MODULE_ID}/packs/_source/${pack}`, 
        { yaml }
      );
      console.log(`  ✅ Successfully unpacked ${pack}\n`);
    } catch (error) {
      console.error(`  ❌ Failed to unpack ${pack}:`, error.message, '\n');
    }
  }
  
  console.log('✨ Extraction complete!');
}

extractPacks().catch(console.error);
