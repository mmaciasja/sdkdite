# Compendium Setup Complete ✅

## Overview
Successfully configured the sdkdite system with a working compendium pack for ancestries.

## Final Structure
```
sdkdite/
├── src/
│   └── packs/
│       └── ancestries/           # ✅ Source files (tracked in Git)
│           ├── ascerbide.json
│           ├── katotero.json
│           ├── prosopo.json
│           └── zoodis.json
├── packs/
│   └── ancestries/               # ✅ Compiled LevelDB (gitignored)
│       ├── CURRENT
│       ├── LOCK
│       ├── LOG
│       ├── MANIFEST-*
│       └── *.log
└── tools/
    ├── compile-packs.mjs         # Build: JSON → LevelDB
    ├── extract-packs.mjs         # Extract: LevelDB → JSON
    └── inspect-db.mjs            # Debug: View database contents
```

## Key Discovery: The `_key` Field

**CRITICAL:** Foundry CLI requires a `_key` field in source JSON files!

### Format
```json
{
  "_key": "!items!<itemId>",
  "_id": "<itemId>",
  "name": "...",
  ...
}
```

### Collection Prefixes
- Items: `!items!<id>`
- Actors: `!actors!<id>`
- Scenes: `!scenes!<id>`
- JournalEntries: `!journal!<id>`

Without this field, the CLI will skip the document during compilation (no error, just silently ignored).

## Commands

### Build Compendium
```bash
npm run build
```
Output:
```
📦 Packing: ancestries
Packed ascerbide001 (Ascerbide)
Packed katotero001 (Katotero)
Packed prosopo001 (Prosopo)
Packed zoodis001 (Zoodis)
✅ Successfully packed ancestries
```

### Extract from Foundry
```bash
npm run extract
```

### Inspect Database
```bash
node tools/inspect-db.mjs
```
Output:
```
📄 Key: !items!prosopo001
   Name: Prosopo
   Type: ancestry

📊 Total items in database: 4
```

## Troubleshooting Timeline

### Failed Approaches
1. ❌ **packs/_source/ancestries/** - CLI didn't find files
2. ❌ **packs/ancestries-source/** - Database remained empty (0 items)
3. ❌ **Direct fvtt CLI commands** - Created nested directories
4. ❌ **JSON without `_key` field** - Silently skipped during compilation

### Root Cause
Created `tools/inspect-db.mjs` which revealed the database had 0 items despite "successful" compilation messages. This led to discovering the `_key` requirement.

### Solution
1. Use official Foundry structure: `src/packs/ancestries/`
2. Add `_key` field to all JSON documents
3. Use `compilePack()` API with `log: true` option

## Configuration Files

### system.json
```json
{
  "packs": [{
    "name": "ancestries",
    "label": "Ancestries",
    "system": "sdkdite",
    "path": "packs/ancestries",
    "type": "Item",
    "ownership": {
      "PLAYER": "OBSERVER",
      "ASSISTANT": "OWNER"
    }
  }]
}
```

### .gitignore
```gitignore
# Compiled Compendium Packs (LevelDB - generated from src/packs)
packs/*/
```

### package.json
```json
{
  "scripts": {
    "build": "node tools/compile-packs.mjs",
    "extract": "node tools/extract-packs.mjs",
    "clean": "node tools/clean-old-source.mjs"
  },
  "devDependencies": {
    "@foundryvtt/foundryvtt-cli": "^3.0.2",
    "classic-level": "^3.0.0"
  }
}
```

## Workflow

### Adding New Items
1. Edit/create JSON in `src/packs/ancestries/`
2. Ensure `_key` field is present: `"_key": "!items!<id>"`
3. Run `npm run build`
4. Reload Foundry

### Extracting Changes
1. Make changes in Foundry UI
2. Run `npm run extract`
3. Review changes in `src/packs/ancestries/`
4. Commit to Git

### Git Workflow
```bash
# Stage source files (JSON)
git add src/packs/

# Do NOT commit compiled packs (gitignored)
# packs/ is auto-generated

# Commit
git commit -m "Add new ancestry items"
```

## Testing Status
- ✅ Compilation: 4 ancestries successfully packed
- ✅ Database: Verified 4 items in LevelDB
- ✅ CLI logging: Showing proper "Packed X (Name)" messages
- ✅ Git configuration: Source tracked, compiled ignored
- ⏳ Foundry UI: Not yet tested (next step)

## Next Steps
1. Start Foundry VTT
2. Navigate to Compendiums tab
3. Verify "Ancestries" pack shows 4 items
4. Test drag & drop to actor sheet
5. Verify baseStats integration
6. Commit all changes
