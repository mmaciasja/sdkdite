import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
import { rollStat } from "./roll.js";
import { calculateUnusedExperience, calculateDerivedStats } from "./calculations.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends foundry.appv1.sheets.ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "sheet", "actor"],
      template: "systems/sdkdite/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("worldbuilding", "macroShorthand");
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.systemData.biography, {
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

    // Stat Roll
    html.find(".stat-v-main.rollable").click(this._onStatRoll.bind(this));

    // Listen for stat changes to recalculate unused experience
    html.find("input[name^='system.']").on("change", this._onStatChange.bind(this));

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

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
