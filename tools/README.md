# Build Tools for SDK DITE System

This directory contains build scripts for managing compendium packs.

## Scripts

### `compile-packs.mjs`
Compiles JSON source files into LevelDB packs that Foundry can use.

**Usage:**
```bash
npm run build
# or
npm run build:db
```

**What it does:**
- Reads all source files from `packs/_source/<packname>/`
- Compiles them into `packs/<packname>/` (LevelDB format)
- LevelDB files are gitignored and regenerated as needed

---

### `extract-packs.mjs`
Extracts LevelDB packs back into editable JSON source files.

**Usage:**
```bash
npm run extract
# or
npm run build:json
```

**What it does:**
- Reads compiled packs from `packs/<packname>/`
- Extracts them to `packs/_source/<packname>/` (JSON format)
- Useful after importing compendium items through Foundry UI

---

### `clean-old-source.mjs`
Removes the old duplicate `src/packs/` directory.

**Usage:**
```bash
npm run clean:packs
```

**What it does:**
- Removes `src/packs/` directory (no longer needed)
- We use `packs/_source/` as the single source of truth

---

## Development Workflow

### 1. **Edit Source Files**
Edit JSON files in `packs/_source/ancestries/` manually or through Foundry.

### 2. **Rebuild Packs**
After editing source files:
```bash
npm run build
```

### 3. **Extract Changes from Foundry**
If you edit compendium items through Foundry UI:
```bash
npm run extract
```

### 4. **Git Workflow**
- **Commit:** Only `packs/_source/` files (JSON)
- **Ignore:** `packs/ancestries/` (LevelDB files)
- **Images:** Tracked with Git LFS

---

## Directory Structure

```
sdkdite/
├── src/
│   └── packs/
│       └── ancestries/       # ✅ Edit these (in Git)
│           ├── prosopo.json
│           ├── zoodis.json
│           ├── ascerbide.json
│           └── katotero.json
├── packs/
│   └── ancestries/           # ❌ Generated (gitignored)
│       ├── CURRENT
│       ├── LOCK
│       ├── LOG
│       └── MANIFEST-*
└── tools/                    # Build scripts
    ├── compile-packs.mjs
    ├── extract-packs.mjs
    └── clean-old-source.mjs
```

---

## Notes

- Based on best practices from Fabula Ultima system
- Uses `@foundryvtt/foundryvtt-cli` for pack compilation
- Source files include full document metadata (`_id`, `_stats`, etc.)
