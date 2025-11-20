import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SimpleItemSheet extends foundry.appv1.sheets.ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sdkdite", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".attributes"],
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    return `systems/sdkdite/templates/item/${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    
    // Localize description if it's a translation key
    let description = context.systemData.description;
    if (description && !description.startsWith('<') && game.i18n.has(description)) {
      description = game.i18n.localize(description);
    }
    
    context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(description, {
      secrets: this.document.isOwner,
      async: true
    });

    // For ancestry items, populate virtues with actual item data
    if (this.item.type === "ancestry" && context.systemData.virtues) {
      context.systemData.virtues = await Promise.all(
        context.systemData.virtues.map(async virtueId => {
          const virtue = game.items.get(virtueId);
          return virtue ? {
            _id: virtueId,
            name: virtue.name,
            img: virtue.img
          } : null;
        })
      );
      context.systemData.virtues = context.systemData.virtues.filter(v => v !== null);
    }

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });

    // Ancestry-specific: Add virtue to ancestry
    html.find(".item-create").click(this._onItemCreate.bind(this));
    
    // Ancestry-specific: Delete virtue from ancestry
    html.find(".item-delete").click(this._onItemDelete.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle adding a virtue to an ancestry item
   */
  async _onItemCreate(event) {
    event.preventDefault();
    if (this.item.type !== "ancestry") return;

    const virtues = game.items.filter(i => i.type === "virtue");
    
    const buttons = {};
    virtues.forEach(virtue => {
      buttons[virtue.id] = {
        label: virtue.name,
        callback: () => virtue.id
      };
    });

    if (Object.keys(buttons).length === 0) {
      ui.notifications.warn("No virtues available. Create virtue items first.");
      return;
    }

    const virtueId = await Dialog.wait({
      title: "Select Virtue",
      content: "<p>Choose a virtue to add:</p>",
      buttons: buttons,
      close: () => null
    });

    if (virtueId) {
      const currentVirtues = this.item.system.virtues || [];
      if (!currentVirtues.includes(virtueId)) {
        await this.item.update({
          "system.virtues": [...currentVirtues, virtueId]
        });
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle deleting a virtue from an ancestry item
   */
  async _onItemDelete(event) {
    event.preventDefault();
    if (this.item.type !== "ancestry") return;

    const virtueIndex = parseInt(event.currentTarget.dataset.virtueIndex);
    const currentVirtues = this.item.system.virtues || [];
    
    currentVirtues.splice(virtueIndex, 1);
    
    await this.item.update({
      "system.virtues": currentVirtues
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    
    // Only apply EntitySheetHelper processing for items that use attributes/groups
    // Ancestry items use their own data structure
    if (this.item.type !== "ancestry") {
      formData = EntitySheetHelper.updateAttributes(formData, this.object);
      formData = EntitySheetHelper.updateGroups(formData, this.object);
    }
    
    return formData;
  }
}
