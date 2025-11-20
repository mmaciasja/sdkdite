# Development Guide for SDK DITE System

## Quick Start

### Prerequisites
- Node.js (LTS version)
- Git with LFS enabled
- Foundry VTT v10+

### Initial Setup
```bash
npm install
npm run build
```

## Daily Development Workflow

### 1. CSS/LESS Changes
The system uses LESS for styling with hot-reload support.

**Watch mode (auto-compile on save):**
```bash
npm run watch
```

**Single build:**
```bash
npm run css
```

**Files:**
- Source: `styles/simple.less`
- Output: `styles/simple.css` (auto-generated, don't edit)

---

### 2. Compendium Development

#### Adding/Editing Items via JSON
1. Edit files in `packs/_source/ancestries/*.json`
2. Rebuild the compendium:
   ```bash
   npm run build
   ```
3. Reload Foundry or use Hot Reload

#### Adding/Editing Items via Foundry UI
1. Make changes in Foundry's compendium UI
2. Extract changes back to JSON:
   ```bash
   npm run extract
   ```
3. Review and commit the JSON files

#### Directory Structure
```
packs/
├── _source/              # ✅ EDIT THESE (tracked in Git)
│   └── ancestries/
│       ├── prosopo.json
│       ├── zoodis.json
│       ├── ascerbide.json
│       └── katotero.json
└── ancestries/           # ❌ GENERATED (gitignored)
    ├── CURRENT
    ├── LOCK
    └── ...
```

---

### 3. Module/Template Changes

Hot Reload is configured for:
- `module/*.js` - JavaScript modules
- `templates/**/*.html` - Handlebars templates
- `lang/*.json` - Localization files
- `styles/*.css` - Compiled CSS

**Simply save your changes** and Foundry will reload automatically.

---

## Build Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile JSON → LevelDB packs |
| `npm run extract` | Extract LevelDB → JSON sources |
| `npm run css` | Compile LESS → CSS (once) |
| `npm run watch` | Auto-compile LESS on changes |
| `npm run clean:packs` | Remove old duplicate directories |

---

## Git Workflow

### What to Commit
✅ **DO commit:**
- `packs/_source/**/*.json` - Compendium source files
- `module/**/*.js` - JavaScript code
- `templates/**/*.html` - HTML templates
- `styles/**/*.less` - LESS source files
- `lang/*.json` - Translations
- `*.svg`, `*.png`, etc. - Images (via Git LFS)

❌ **DON'T commit:**
- `packs/ancestries/` - Generated LevelDB files
- `styles/simple.css` - Generated from LESS
- `node_modules/` - Dependencies

### Typical Workflow
```bash
# Make changes to source files
# ...

# Rebuild if needed
npm run build

# Stage changes
git add packs/_source/ module/ templates/

# Commit
git commit -m "Add new ancestry: Dragonborn"

# Push
git push
```

---

## Adding New Compendium Packs

### 1. Create Source Directory
```bash
mkdir packs\_source\<packname>
```

### 2. Add to system.json
```json
{
  "packs": [
    {
      "name": "packname",
      "label": "Pack Display Name",
      "path": "packs/packname",
      "type": "Item",
      "ownership": {
        "PLAYER": "OBSERVER",
        "ASSISTANT": "OWNER"
      }
    }
  ]
}
```

### 3. Build
```bash
npm run build
```

---

## Troubleshooting

### Compendium not showing items
```bash
# Rebuild the packs
npm run build

# If still not working, check system.json packs configuration
```

### Changes not reflecting in Foundry
1. Check Hot Reload is enabled in Foundry settings
2. Try manual reload (F5)
3. For compendium changes, run `npm run build`

### Git LFS issues
```bash
# Ensure Git LFS is installed
git lfs install

# Pull LFS files
git lfs pull
```

---

## Project Structure

```
sdkdite/
├── module/                 # JavaScript modules
│   ├── simple.js          # Main entry point
│   ├── actor.js           # Actor document
│   ├── item.js            # Item document
│   └── ...
├── templates/             # Handlebars templates
│   ├── actors/
│   ├── item/
│   └── parts/
├── styles/                # Styling
│   ├── simple.less        # Source (edit this)
│   └── simple.css         # Generated (don't edit)
├── packs/
│   ├── _source/           # Compendium sources
│   └── ancestries/        # Compiled packs
├── tools/                 # Build scripts
│   ├── compile-packs.mjs
│   ├── extract-packs.mjs
│   └── README.md
├── lang/                  # Translations
├── system.json            # System manifest
├── template.json          # Data model definitions
└── package.json           # NPM configuration
```

---

## Resources

- [Foundry VTT Development Docs](https://foundryvtt.com/article/system-development/)
- [FoundryVTT CLI](https://github.com/foundryvtt/foundryvtt-cli)
- [Project Repository](https://github.com/mmaciasja/sdkdite/)
