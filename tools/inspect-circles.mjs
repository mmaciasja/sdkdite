import { ClassicLevel } from 'classic-level';

const db = new ClassicLevel('./packs/circles', { valueEncoding: 'json' });

console.log('\n🔍 Inspecting Circles Database:\n');

const items = [];
for await (const [key, value] of db.iterator()) {
  items.push({ 
    key, 
    name: value.name, 
    type: value.type,
    stats: value.system?.stats
  });
  console.log(`  ✓ ${value.name}`);
  if (value.system?.stats) {
    const stats = value.system.stats;
    console.log(`    Stats: Strike ${stats.strike}, Defense ${stats.defense}, Will ${stats.will}, Insight ${stats.insight}, Speed ${stats.speed}`);
  }
}

await db.close();

console.log(`\n📊 Total circles: ${items.length}\n`);
