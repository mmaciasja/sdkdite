import { extractPack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';
import path from 'path';

const PACKAGE_ID = process.cwd();
const yaml = false;
const expandAdventures = false;
const folders = false;

/**
 * Extract LevelDB packs to JSON source files
 * Based on official Foundry documentation
 */
async function extractPacks() {
  console.log('🔄 Extracting packs from LevelDB to JSON...\n');

  const packs = await fs.readdir('./packs');
  for (const pack of packs) {
    if (pack.startsWith('.') || pack.endsWith('-test') || pack.endsWith('-source')) continue;
    
    // Verify it's a directory
    const stats = await fs.stat(`./packs/${pack}`);
    if (!stats.isDirectory()) continue;
    
    console.log(`📦 Unpacking: ${pack}`);
    
    try {
      await extractPack(
        `${PACKAGE_ID}/packs/${pack}`,
        `${PACKAGE_ID}/src/packs/${pack}`,
        {
          yaml,
          expandAdventures,
          folders,
          clean: true
        }
      );
      console.log(`  ✅ Successfully unpacked ${pack}\n`);
    } catch (error) {
      console.error(`  ❌ Failed to unpack ${pack}:`, error.message, '\n');
    }
  }
  
  console.log('✨ Extraction complete!');
}

extractPacks().catch(console.error);
