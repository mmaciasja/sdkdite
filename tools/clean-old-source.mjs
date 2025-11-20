import { promises as fs } from 'fs';
import path from 'path';

/**
 * Clean up old source directory (src/packs/)
 * This removes the duplicate source location
 */
async function cleanOldSource() {
  console.log('🧹 Cleaning up old source directory...\n');

  const oldSourcePath = './src/packs';
  
  try {
    const stats = await fs.stat(oldSourcePath);
    if (stats.isDirectory()) {
      console.log(`📁 Found old source directory: ${oldSourcePath}`);
      console.log('   Removing...');
      await fs.rm(oldSourcePath, { recursive: true, force: true });
      console.log('   ✅ Removed successfully\n');
      
      // Check if src directory is now empty
      const srcContents = await fs.readdir('./src');
      if (srcContents.length === 0) {
        console.log('📁 src directory is now empty, removing...');
        await fs.rmdir('./src');
        console.log('   ✅ Removed src directory\n');
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('✅ No old source directory found (already clean)\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('✨ Cleanup complete!');
  console.log('\nℹ️  Source files are now only in: packs/_source/');
}

cleanOldSource().catch(console.error);
