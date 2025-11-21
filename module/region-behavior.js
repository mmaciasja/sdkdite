/**
 * Custom Region Behavior for applying stat modifiers to tokens within a region.
 */
export class StatModifierRegionBehavior extends foundry.data.regionBehaviors.RegionBehaviorType {
  
  /** @override */
  static LOCALIZATION_PREFIXES = ["SDKDITE.REGION.BEHAVIOR"];

  /** @override */
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      // Stat modifiers that will be applied to tokens in this region
      modifiers: new fields.SchemaField({
        // Primary Stats
        strength: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        constitution: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        dexterity: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        charisma: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        intelligence: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        
        // Combat Stats
        strike: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        insight: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        speed: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        defense: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        will: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        
        // Resources
        health: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
        power: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true })
      }),
      
      // Optional description of what this region represents
      description: new fields.HTMLField({ required: false, blank: true }),
      
      // Visual settings
      displayInChat: new fields.BooleanField({ required: true, nullable: false, initial: true })
    };
  }

  /**
   * Handle a token entering the region.
   * @param {RegionEvent} event - The region event
   */
  async _handleTokenEnter(event) {
    const token = event.data.token;
    if (!token?.actor) return;

    const modifiers = this.modifiers;
    const hasModifiers = Object.values(modifiers).some(val => val !== 0);
    
    if (!hasModifiers) return;

    // Store region modifiers on the token for reference
    await token.setFlag("sdkdite", "regionModifiers", {
      regionId: this.parent.uuid,
      modifiers: modifiers
    });

    // Force actor to recalculate derived stats
    if (token.actor.sheet?.rendered) {
      token.actor.prepareData();
      token.actor.sheet.render(false);
    }

    // Notify in chat if enabled
    if (this.displayInChat) {
      const modifierList = this._formatModifiers(modifiers);
      if (modifierList.length > 0) {
        ChatMessage.create({
          content: `<div class="sdkdite region-entry">
            <h3>${token.name} entered: ${this.parent.name || "Unnamed Region"}</h3>
            <p class="modifiers">${modifierList.join(", ")}</p>
            ${this.description ? `<p class="description">${this.description}</p>` : ""}
          </div>`,
          speaker: { alias: "Region Effect" }
        });
      }
    }
  }

  /**
   * Handle a token exiting the region.
   * @param {RegionEvent} event - The region event
   */
  async _handleTokenExit(event) {
    const token = event.data.token;
    if (!token?.actor) return;

    // Remove region modifiers
    await token.unsetFlag("sdkdite", "regionModifiers");

    // Force actor to recalculate derived stats
    if (token.actor.sheet?.rendered) {
      token.actor.prepareData();
      token.actor.sheet.render(false);
    }

    // Notify in chat if enabled
    if (this.displayInChat) {
      ChatMessage.create({
        content: `<div class="sdkdite region-exit">
          <h3>${token.name} left: ${this.parent.name || "Unnamed Region"}</h3>
        </div>`,
        speaker: { alias: "Region Effect" }
      });
    }
  }

  /**
   * Format modifiers for display.
   * @param {Object} modifiers - The modifiers object
   * @returns {string[]} Array of formatted modifier strings
   * @private
   */
  _formatModifiers(modifiers) {
    const formatted = [];
    for (const [stat, value] of Object.entries(modifiers)) {
      if (value !== 0) {
        const sign = value > 0 ? "+" : "";
        const label = stat.charAt(0).toUpperCase() + stat.slice(1);
        formatted.push(`${sign}${value} ${label}`);
      }
    }
    return formatted;
  }

  /** @override */
  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.prototype._handleTokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.prototype._handleTokenExit
  };
}
