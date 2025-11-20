import { promises as fs } from 'fs';
import path from 'path';

/**
 * Clean up old source directory (src/packs/)
 * This removes the duplicate source location
 */
async function cleanOldSource() {
  console.log('🧹 Cleaning up old source directory...\n');

  const oldSourcePath = './packs/_source';
  
  try {
    const stats = await fs.stat(oldSourcePath);
    if (stats.isDirectory()) {
      console.log(`📁 Found old _source directory: ${oldSourcePath}`);
      console.log('   Removing...');
      await fs.rm(oldSourcePath, { recursive: true, force: true });
      console.log('   ✅ Removed successfully\n');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('✅ No old _source directory found (already clean)\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('✨ Cleanup complete!');
  console.log('\nℹ️  Source files are now in: packs/<packname>-source/');
}

cleanOldSource().catch(console.error);
