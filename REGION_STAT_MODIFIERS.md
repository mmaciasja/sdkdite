# Region-Based Stat Modifiers - Setup Guide

## Overview
The sdkdite system includes region-based stat modifiers that allow you to create environmental effects that modify character stats when tokens enter specific areas of a scene.

## Current Status
**Note:** Foundry VTT v13 does not currently support custom region behavior types in the UI dropdown. The custom `StatModifierRegionBehavior` class has been implemented and registered, but it won't appear in the "Add Behavior" dropdown.

## Workaround Solution

Until Foundry adds support for custom region behaviors in the UI, you can use the built-in **Execute Script** behavior to achieve the same functionality:

### Setup Steps

1. **Create a Region** in your scene (Scene Configuration → Regions tab)

2. **Add Behavior: Execute Script** (Token Enter)
   ```javascript
   const modifiers = {
     strength: 0,
     constitution: 0,
     dexterity: 0,
     charisma: 0,
     intelligence: 0,
     strike: 2,      // Example: +2 Strike in this region
     insight: 0,
     speed: -1,      // Example: -1 Speed (difficult terrain)
     defense: 1,     // Example: +1 Defense (cover)
     will: 0,
     health: 0,
     power: 0
   };
   
   const token = event.data.token;
   await token.setFlag("sdkdite", "regionModifiers", {
     regionId: region.uuid,
     modifiers: modifiers
   });
   
   if (token.actor) {
     token.actor.prepareData();
     if (token.actor.sheet?.rendered) {
       token.actor.sheet.render(false);
     }
   }
   
   // Optional: Display in chat
   const activeModifiers = Object.entries(modifiers)
     .filter(([stat, value]) => value !== 0)
     .map(([stat, value]) => {
       const sign = value > 0 ? "+" : "";
       const label = stat.charAt(0).toUpperCase() + stat.slice(1);
       return `${sign}${value} ${label}`;
     });
   
   if (activeModifiers.length > 0) {
     ChatMessage.create({
       content: `<div class="sdkdite region-entry">
         <h3>${token.name} entered: ${region.name}</h3>
         <p class="modifiers">${activeModifiers.join(", ")}</p>
       </div>`,
       speaker: { alias: "Region Effect" }
     });
   }
   ```

3. **Add Behavior: Execute Script** (Token Exit)
   ```javascript
   const token = event.data.token;
   await token.unsetFlag("sdkdite", "regionModifiers");
   
   if (token.actor) {
     token.actor.prepareData();
     if (token.actor.sheet?.rendered) {
       token.actor.sheet.render(false);
     }
   }
   
   // Optional: Display in chat
   ChatMessage.create({
     content: `<div class="sdkdite region-exit">
       <h3>${token.name} left: ${region.name}</h3>
     </div>`,
     speaker: { alias: "Region Effect" }
   });
   ```

### How It Works

1. When a token **enters** the region, the script stores modifier values in the token's flags
2. The `calculations.js` module reads these modifiers and applies them to all stat calculations
3. When a token **exits** the region, the modifiers are removed and stats recalculate
4. Chat messages notify players when tokens enter/exit regions (optional)

### Modifier Types

You can modify any of these stats:

**Primary Stats:**
- strength
- constitution
- dexterity
- charisma
- intelligence

**Combat Stats:**
- strike (attack bonus)
- insight (initiative bonus)
- speed (movement)
- defense
- will (mental defense)

**Resources:**
- health (max HP modifier)
- power (max Power modifier)

### Example Regions

**Difficult Terrain:**
```javascript
const modifiers = { speed: -1 };  // -1 Speed
```

**Cover Position:**
```javascript
const modifiers = { defense: 2, strike: -1 };  // +2 Defense, -1 Strike (harder to shoot from)
```

**Magical Enhancement:**
```javascript
const modifiers = { intelligence: 1, power: 5 };  // +1 Intelligence, +5 max Power
```

**Cursed Ground:**
```javascript
const modifiers = { will: -2, health: -10 };  // -2 Will, -10 max Health
```

**High Ground Advantage:**
```javascript
const modifiers = { strike: 1, insight: 1 };  // +1 Strike, +1 Insight
```

## Future Enhancement

When Foundry VTT adds support for custom region behavior types in future versions, the system is already prepared with the `StatModifierRegionBehavior` class, which will allow you to configure stat modifiers through a proper UI form instead of writing scripts.

## Troubleshooting

**Stats not updating?**
- Make sure the token has an actor assigned
- Check that the actor sheet auto-recalculates (the system handles this automatically)
- Verify the region is enabled and the behavior is active

**Chat messages not appearing?**
- Remove the chat message code blocks if you don't want notifications
- Check that chat permissions are properly configured

**Modifiers persisting after leaving region?**
- Make sure both Enter and Exit scripts are configured
- The Exit script must use `unsetFlag` to remove the modifiers
