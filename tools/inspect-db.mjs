import { ClassicLevel } from 'classic-level';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function inspectDB() {
  console.log('🔍 Inspecting LevelDB database...\n');
  
  const db = new ClassicLevel('./packs/ancestries', { valueEncoding: 'json' });
  
  try {
    await db.open();
    console.log('✅ Database opened successfully\n');
    
    let count = 0;
    for await (const [key, value] of db.iterator()) {
      count++;
      console.log(`📄 Key: ${key}`);
      console.log(`   Name: ${value.name}`);
      console.log(`   Type: ${value.type}`);
      console.log('');
    }
    
    console.log(`\n📊 Total items in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

inspectDB().catch(console.error);
