import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
import { rollStat } from "./roll.js";
import { sendItemToChat } from "./chat.js";
import { 
  calculateUnusedExperience, 
  calculateDerivedStats, 
  calculateDescentLevel, 
  getVirtueLimits, 
  countVirtuesByType 
} from "./calculations.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends foundry.appv1.sheets.ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sdkdite", "sheet", "actor"],
      template: "systems/sdkdite/templates/actors/playable-character/actor-playable-character.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biography", ".items", ".attributes", ".diary"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("sdkdite", "macroShorthand");
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    
    // Initialize tabs object if it doesn't exist
    if (!context.systemData.tabs) {
      context.systemData.tabs = {
        skills: true,
        combat: true,
        mask: true,
        rhapsodies: true,
        vulcanotech: true,
        almakathir: true,
        omniferis: true,
        diary: true
      };
    }
    
    // Get ancestry item from actor's items
    if (context.systemData.ancestryId) {
      context.ancestryItem = this.actor.items.get(context.systemData.ancestryId);
    }
    
    // Get circle item from actor's items
    if (context.systemData.circleId) {
      context.circleItem = this.actor.items.get(context.systemData.circleId);
    }
    
    // Calculate descent level based on total experience
    const totalExp = context.systemData.experience?.value || 0;
    const descentLevel = calculateDescentLevel(totalExp);
    context.descentLevel = descentLevel;
    context.descentStars = descentLevel > 0 ? Array(3).fill(false).map((_, i) => i < descentLevel) : null;
    
    // Get virtue limits for current descent level
    const virtueLimits = getVirtueLimits(descentLevel);
    context.virtueLimits = virtueLimits;
    
    // Calculate total available slots
    const totalSlots = Object.values(virtueLimits).reduce((sum, val) => sum + val, 0);
    
    // Prepare virtue slots based on descent level limits
    const virtueItems = this.actor.items.filter(item => item.type === "virtue");
    
    // Count current virtues by type
    const virtueCountsByType = countVirtuesByType(virtueItems);
    context.virtueCountsByType = virtueCountsByType;
    
    // Create slots array
    context.virtueSlots = Array(totalSlots).fill(null).map((_, index) => {
      const virtue = virtueItems[index];
      return {
        virtue: virtue || null
      };
    });
    
    context.biographyHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.systemData.biography, {
      secrets: this.document.isOwner,
      async: true
    });
    context.diaryHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.systemData.diary, {
      secrets: this.document.isOwner,
      async: true
    });
    // Add edit mode state
    context.editMode = this.editMode ?? false;
    
    // Calculate derived stats (value = 5 + mod + level for all stats)
    calculateDerivedStats(this.actor);
    
    // Calculate unused experience
    calculateUnusedExperience(this.actor);
    
    // Update context with calculated values
    context.systemData = this.actor.system;
    
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Edit Mode Toggle
    html.find(".edit-mode-toggle").click(this._onToggleEditMode.bind(this));

    // Tab Visibility Toggle
    html.find(".tab-visibility-toggle").click(this._onToggleTabVisibility.bind(this));

    // Ancestry/Circle Image Box Click
    html.find(".char-item-small").click(this._onImageBoxClick.bind(this));

    // Stat Roll
    html.find(".stat-v-main.rollable").click(this._onStatRoll.bind(this));

    // Stat Increment/Decrement Buttons
    html.find(".stat-increment").click(this._onStatIncrement.bind(this));

    // Listen for stat changes to recalculate unused experience
    html.find("input[name^='system.']").on("change", this._onStatChange.bind(this));

    // Virtue Slots
    html.find(".virtue-add-button").click(this._onVirtueAddClick.bind(this));
    html.find(".virtue-item").click(this._onVirtueItemClick.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle stat value changes to update calculated fields
   * @param {Event} event   The originating change event
   * @private
   */
  async _onStatChange(event) {
    event.preventDefault();
    
    // Submit the form to update the actor data
    await this._onSubmit(event);
    
    // Recalculate derived stats and unused experience
    calculateDerivedStats(this.actor);
    calculateUnusedExperience(this.actor);
    
    // Re-render to show updated values
    this.render(false);
  }

  /* -------------------------------------------- */

  /**
   * Toggle edit mode for stat details
   * @param {Event} event   The originating click event
   * @private
   */
  _onToggleEditMode(event) {
    event.preventDefault();
    this.editMode = !this.editMode;
    this.render(false);
  }

  /* -------------------------------------------- */

  /**
   * Toggle tab visibility
   * @param {Event} event   The originating click event
   * @private
   */
  async _onToggleTabVisibility(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const tabTarget = event.currentTarget.dataset.tabTarget;
    
    // Initialize tabs object if it doesn't exist
    if (!this.actor.system.tabs) {
      await this.actor.update({
        "system.tabs": {
          skills: true,
          combat: true,
          mask: true,
          rhapsodies: true,
          vulcanotech: true,
          almakathir: true,
          omniferis: true,
          diary: true
        }
      });
    }
    
    const currentValue = this.actor.system.tabs?.[tabTarget] ?? true;
    
    await this.actor.update({
      [`system.tabs.${tabTarget}`]: !currentValue
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle stat rolls
   * @param {Event} event   The originating click event
   * @private
   */
  async _onStatRoll(event) {
    event.preventDefault();
    const statName = event.currentTarget.dataset.stat;
    const statData = this.actor.system[statName];
    
    if (!statData) return;
    
    const statValue = statData.value || 0;
    const statMod = statData.mod || 0;
    
    // Capitalize stat name for display
    const displayName = statName.charAt(0).toUpperCase() + statName.slice(1);
    
    await rollStat(this.actor, displayName, statValue, statMod);
  }

  /* -------------------------------------------- */

  /**
   * Handle stat increment/decrement button clicks
   * @param {Event} event   The originating click event
   * @private
   */
  async _onStatIncrement(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const statName = button.dataset.stat;
    const action = button.dataset.action;
    
    if (!statName) return;
    
    const currentLevel = this.actor.system[statName]?.level || 0;
    const availableExperience = this.actor.system.experience?.unused ?? calculateUnusedExperience(this.actor);

    if (action === "increment" && availableExperience < 3) {
      ui.notifications.warn("Not enough unused experience to increase this stat (requires 3).");
      return;
    }

    if (action === "decrement" && currentLevel <= 0) {
      ui.notifications.warn("Stat level cannot go below 0.");
      return;
    }

    const newLevel = Math.max(0, action === "increment" ? currentLevel + 1 : currentLevel - 1);
    
    await this.actor.update({
      [`system.${statName}.level`]: newLevel
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle clicking on ancestry/circle image boxes
   * @param {Event} event   The originating click event
   * @private
   */
  async _onImageBoxClick(event) {
    event.preventDefault();
    const itemType = event.currentTarget.dataset.itemType;
    
    if (!itemType) return;
    
    // Skip descent for now (it's just stars, not an item)
    if (itemType === 'descent') return;
    
    // Get the current item if it exists
    const currentItemId = this.actor.system[`${itemType}Id`];
    const currentItem = currentItemId ? this.actor.items.get(currentItemId) : null;
    
    // If not in edit mode and item exists, show the item sheet
    if (!this.editMode && currentItem) {
      currentItem.sheet.render(true);
      return;
    }
    
    // If in edit mode or no item exists, show selection dialog
    if (!this.editMode && !currentItem) return; // Do nothing in view mode if no item
    
    // Get all items of the specified type from game.items
    const worldItems = game.items.filter(i => i.type === itemType);
    
    // Get items from compendium
    const compendiumItems = [];
    for (const pack of game.packs) {
      if (pack.metadata.type === "Item") {
        const index = await pack.getIndex();
        for (const entry of index) {
          if (entry.type === itemType) {
            const item = await pack.getDocument(entry._id);
            if (item) compendiumItems.push(item);
          }
        }
      }
    }
    
    // Combine both sources
    const availableItems = [...worldItems, ...compendiumItems];
    
    if (availableItems.length === 0) {
      ui.notifications.warn(`No ${itemType} items available. Create some in the Items directory or add them to a compendium.`);
      return;
    }
    
    // Create dialog with item selection
    const content = `
      <form>
        <div class="form-group">
          <label>Select ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}:</label>
          <select name="itemId">
            <option value="">-- None --</option>
            ${availableItems.map(item => {
              const source = item.pack ? `[Compendium]` : `[World]`;
              const selected = currentItem && item.uuid === currentItem.uuid ? 'selected' : '';
              return `<option value="${item.uuid}" ${selected}>${item.name} ${source}</option>`;
            }).join('')}
          </select>
        </div>
      </form>
    `;
    
    new Dialog({
      title: `Select ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      content: content,
      buttons: {
        select: {
          label: "Select",
          callback: async (html) => {
            const itemUuid = html.find('[name="itemId"]').val();
            if (!itemUuid) {
              // Remove the item if "None" is selected
              if (currentItemId) {
                await this.actor.deleteEmbeddedDocuments("Item", [currentItemId]);
              }
              await this.actor.update({
                [`system.${itemType}Id`]: null
              });
              return;
            }
            
            // Get the item from UUID (works for both world and compendium items)
            const item = await fromUuid(itemUuid);
            if (!item) return;
            
            // Remove old item if it exists
            if (currentItemId) {
              await this.actor.deleteEmbeddedDocuments("Item", [currentItemId]);
            }
            
            // Create a copy of the item on the actor
            const itemData = item.toObject();
            const [createdItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
            
            // Update the actor to reference this item
            await this.actor.update({
              [`system.${itemType}Id`]: createdItem.id
            });
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "select"
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle clicking on the add virtue button
   * @param {Event} event   The originating click event
   * @private
   */
  async _onVirtueAddClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const addButton = event.currentTarget;
    const slot = addButton.closest('.virtue-slot');
    const slotIndex = parseInt(slot.dataset.slotIndex);
    
    // Show virtue selection dialog
    await this._showVirtueSelectionDialog(slotIndex);
  }

  /* -------------------------------------------- */

  /**
   * Handle clicking on a virtue item
   * @param {Event} event   The originating click event
   * @private
   */
  async _onVirtueItemClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const virtueId = event.currentTarget.dataset.virtueId;
    const virtue = this.actor.items.get(virtueId);
    
    if (!virtue) return;
    
    // In edit mode, show context menu with options
    if (this.editMode) {
      // Get the slot index
      const slot = event.currentTarget.closest('.virtue-slot');
      const slotIndex = parseInt(slot.dataset.slotIndex);
      
      new Dialog({
        title: virtue.name,
        content: `<p>What would you like to do with <strong>${virtue.name}</strong>?</p>`,
        buttons: {
          change: {
            icon: '<i class="fas fa-exchange-alt"></i>',
            label: "Change",
            callback: async () => {
              // First remove the current virtue
              await virtue.delete();
              // Then show the selection dialog
              await this._showVirtueSelectionDialog(slotIndex);
            }
          },
          remove: {
            icon: '<i class="fas fa-trash"></i>',
            label: "Remove",
            callback: async () => {
              const confirmed = await Dialog.confirm({
                title: "Remove Virtue",
                content: `<p>Remove <strong>${virtue.name}</strong> from this character?</p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false
              });
              
              if (confirmed) {
                await virtue.delete();
              }
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel"
          }
        },
        default: "change"
      }).render(true);
    } else {
      // In view mode, send virtue info to chat instead of opening sheet
      await sendItemToChat(this.actor, virtue);
    }
  }

  /* -------------------------------------------- */

  /**
   * Show virtue selection dialog
   * @param {number} slotIndex   The slot index
   * @private
   */
  async _showVirtueSelectionDialog(slotIndex) {
    // Get descent level and virtue limits
    const totalExp = this.actor.system.experience?.value || 0;
    const descentLevel = calculateDescentLevel(totalExp);
    const virtueLimits = getVirtueLimits(descentLevel);
    
    // Count current virtues by type
    const virtueItems = this.actor.items.filter(item => item.type === "virtue");
    const virtueCountsByType = countVirtuesByType(virtueItems);
    
    // Get all virtue items from world
    const worldVirtues = game.items.filter(i => i.type === "virtue");
    
    // Get virtues from compendium
    const compendiumVirtues = [];
    for (const pack of game.packs) {
      if (pack.metadata.type === "Item") {
        const index = await pack.getIndex();
        for (const entry of index) {
          if (entry.type === "virtue") {
            const item = await pack.getDocument(entry._id);
            if (item) compendiumVirtues.push(item);
          }
        }
      }
    }
    
    // Combine both sources and filter by available types
    const allVirtues = [...worldVirtues, ...compendiumVirtues];
    const availableVirtues = allVirtues.filter(virtue => {
      const virtueType = virtue.system.type || "Fragmented";
      const limit = virtueLimits[virtueType] || 0;
      const current = virtueCountsByType[virtueType] || 0;
      return current < limit;
    });
    
    if (availableVirtues.length === 0) {
      ui.notifications.warn("No virtue slots available for your current descent level or all virtue types are at their limit.");
      return;
    }
    
    // Create virtue limit info text
    const limitInfo = Object.entries(virtueLimits)
      .filter(([type, limit]) => limit > 0)
      .map(([type, limit]) => {
        const current = virtueCountsByType[type] || 0;
        return `${type}: ${current}/${limit}`;
      })
      .join(', ');
    
    // Create dialog with virtue selection
    const content = `
      <form>
        <div class="form-group">
          <label>Virtue Limits (Descent ${descentLevel}):</label>
          <p style="font-size: 12px; color: #666; margin: 5px 0 10px 0;">${limitInfo}</p>
        </div>
        <div class="form-group">
          <label>Select Virtue:</label>
          <select name="virtueUuid">
            <option value="">-- Select --</option>
            ${availableVirtues.map(virtue => {
              const source = virtue.pack ? `[Compendium]` : `[World]`;
              const branch = virtue.system.branch || "Unknown";
              const type = virtue.system.type || "Unknown";
              return `<option value="${virtue.uuid}">${virtue.name} (${branch} - ${type}) ${source}</option>`;
            }).join('')}
          </select>
        </div>
      </form>
    `;
    
    new Dialog({
      title: "Add Virtue",
      content: content,
      buttons: {
        add: {
          label: "Add",
          callback: async (html) => {
            const virtueUuid = html.find('[name="virtueUuid"]').val();
            if (!virtueUuid) return;
            
            // Get the virtue from UUID
            const virtue = await fromUuid(virtueUuid);
            if (!virtue) return;
            
            // Create a copy of the virtue on the actor
            const virtueData = virtue.toObject();
            await this.actor.createEmbeddedDocuments("Item", [virtueData]);
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "add"
    }).render(true);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
