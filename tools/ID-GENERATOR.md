# ID Generator Tool

This tool generates valid 16-character IDs for FoundryVTT entities following a consistent structure.

## ID Structure

Each ID is exactly **16 characters** composed of:

```
[ORDER][TYPE][SUBTYPE][RANDOM]
  3      3      3         7
```

- **ORDER** (3 chars): Optional order prefix for sorting (use `000` if not needed)
- **TYPE** (3 chars): Entity type code
- **SUBTYPE** (3 chars): Entity subtype code
- **RANDOM** (7 chars): Random alphanumeric string to avoid collisions

## Usage

### Command Line

```bash
# Generate single ID
node tools/generate-id.mjs <type> <subtype> [order]

# Generate with npm script
npm run gen-id <type> <subtype> [order]

# Get help
node tools/generate-id.mjs --help
```

### Examples

```bash
# Generate a virtue ID (no order)
node tools/generate-id.mjs item virtue
# Output: 000itmvrtx7k2p9a

# Generate an ancestry ID with order
node tools/generate-id.mjs item ancestry 001
# Output: 001itmancj4h8x2m

# Generate a playable character ID
node tools/generate-id.mjs actor playable-character
# Output: 000actvpc9kl3m7n
```

### Batch Generation

Generate multiple IDs at once:

```bash
# Generate 5 virtue IDs
node tools/generate-id.mjs --batch item virtue 5

# Generate 10 skill IDs starting from order 1
node tools/generate-id.mjs --batch item skill 10 --start 1
```

## Valid Types and Subtypes

### Types

- `actor` - Character actors
- `item` - Items and equipment
- `scene` - Game scenes
- `journal` - Journal entries
- `macro` - Macros
- `playlist` - Audio playlists
- `table` - Rollable tables
- `card` - Cards

### Item Subtypes

- `playable-character` → `vpc`
- `ancestry` → `anc`
- `circle` → `crc`
- `skill` → `skl`
- `expertise` → `exp`
- `virtue` → `vrt`

### Actor Subtypes

- `playable-character` → `vpc`
- `npc` → `npc`
- `monster` → `mon`

## Integration in JSON Files

When creating compendium entries, use the generated IDs:

```json
{
  "_key": "!items!000itmvrtx7k2p9a",
  "_id": "000itmvrtx7k2p9a",
  "name": "My Virtue",
  "type": "virtue",
  ...
}
```

## Quick Reference

Common commands for this system:

```bash
# Virtues (unordered)
node tools/generate-id.mjs item virtue

# Ancestries (ordered)
node tools/generate-id.mjs item ancestry 001
node tools/generate-id.mjs item ancestry 002

# Circles (ordered 01-10)
node tools/generate-id.mjs item circle 001
node tools/generate-id.mjs item circle 010

# Skills
node tools/generate-id.mjs item skill

# Expertise
node tools/generate-id.mjs item expertise

# Batch generate 20 virtues
node tools/generate-id.mjs --batch item virtue 20
```

## Notes

- IDs are **always 16 characters**
- Random portion ensures uniqueness
- Order prefix useful for sorting in compendia
- Use `000` for order when sorting is not needed
- IDs are lowercase alphanumeric only
