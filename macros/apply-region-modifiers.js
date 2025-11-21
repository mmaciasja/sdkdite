/**
 * Apply Region Stat Modifiers Macro
 * 
 * This macro applies stat modifiers to all tokens in a selected region.
 * Configure the modifiers below and run the macro.
 */

// ====== CONFIGURATION ======
const modifiers = {
  strength: 0,
  constitution: 0,
  dexterity: 0,
  charisma: 0,
  intelligence: 0,
  strike: 10,     // +10 Strike bonus
  insight: 0,
  speed: 0,
  defense: 0,
  will: 0,
  health: 0,
  power: 0
};

const regionName = "Combat Zone"; // Name for chat messages
const showChatMessage = true;      // Show notification in chat
// ===========================

async function applyModifiers() {
  // Get selected tokens
  const tokens = canvas.tokens.controlled;
  
  if (tokens.length === 0) {
    ui.notifications.warn("Please select at least one token!");
    return;
  }

  // Apply modifiers to each token
  for (const token of tokens) {
    if (!token.actor) {
      ui.notifications.warn(`Token "${token.name}" has no actor assigned.`);
      continue;
    }

    // Store modifiers in token flags
    await token.document.setFlag("sdkdite", "regionModifiers", {
      regionId: "macro-applied",
      modifiers: modifiers
    });

    // Force actor to recalculate stats
    token.actor.prepareData();
    if (token.actor.sheet?.rendered) {
      token.actor.sheet.render(false);
    }

    console.log(`Applied modifiers to ${token.name}:`, modifiers);
  }

  // Show chat message if enabled
  if (showChatMessage) {
    const activeModifiers = Object.entries(modifiers)
      .filter(([stat, value]) => value !== 0)
      .map(([stat, value]) => {
        const sign = value > 0 ? "+" : "";
        const label = stat.charAt(0).toUpperCase() + stat.slice(1);
        return `${sign}${value} ${label}`;
      });

    if (activeModifiers.length > 0) {
      const tokenNames = tokens.map(t => t.name).join(", ");
      ChatMessage.create({
        content: `<div class="sdkdite region-entry">
          <h3>Region Modifiers Applied: ${regionName}</h3>
          <p><strong>Tokens:</strong> ${tokenNames}</p>
          <p class="modifiers">${activeModifiers.join(", ")}</p>
        </div>`,
        speaker: { alias: "Region Effect" }
      });
    }
  }

  ui.notifications.info(`Applied modifiers to ${tokens.length} token(s)`);
}

async function removeModifiers() {
  const tokens = canvas.tokens.controlled;
  
  if (tokens.length === 0) {
    ui.notifications.warn("Please select at least one token!");
    return;
  }

  for (const token of tokens) {
    if (!token.actor) continue;

    // Remove modifiers
    await token.document.unsetFlag("sdkdite", "regionModifiers");

    // Force recalculation
    token.actor.prepareData();
    if (token.actor.sheet?.rendered) {
      token.actor.sheet.render(false);
    }
  }

  if (showChatMessage) {
    const tokenNames = tokens.map(t => t.name).join(", ");
    ChatMessage.create({
      content: `<div class="sdkdite region-exit">
        <h3>Region Modifiers Removed: ${regionName}</h3>
        <p><strong>Tokens:</strong> ${tokenNames}</p>
      </div>`,
      speaker: { alias: "Region Effect" }
    });
  }

  ui.notifications.info(`Removed modifiers from ${tokens.length} token(s)`);
}

// Show dialog to choose action
new Dialog({
  title: "Region Stat Modifiers",
  content: `
    <form>
      <div class="form-group">
        <label>Choose an action:</label>
        <p style="font-size: 0.9em; color: #999;">
          Selected tokens: ${canvas.tokens.controlled.length}
        </p>
        <p style="font-size: 0.9em; margin-top: 10px;">
          <strong>Current modifiers:</strong><br>
          ${Object.entries(modifiers)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
            .join(', ') || 'None'}
        </p>
      </div>
    </form>
  `,
  buttons: {
    apply: {
      icon: '<i class="fas fa-plus"></i>',
      label: "Apply Modifiers",
      callback: () => applyModifiers()
    },
    remove: {
      icon: '<i class="fas fa-minus"></i>',
      label: "Remove Modifiers",
      callback: () => removeModifiers()
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel"
    }
  },
  default: "apply"
}).render(true);
