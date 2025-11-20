/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItem } from "./item.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SimpleActorSheet } from "./actor-playable-character.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { createWorldbuildingMacro } from "./macro.js";
import { SimpleToken, SimpleTokenDocument } from "./token.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Dite 2D10 System`);

  // Auto-reload on JS file changes in development
  if (game.modules.get("_hot-reload")?.active) {
    Hooks.on("hotReload", (data) => {
      if (data.extension === "js" || data.extension === "mjs") {
        console.log(`Hot reloading JS file: ${data.path}`);
        window.location.reload();
      }
    });
  }

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  game.sdkdite = {
    SimpleActor,
    createWorldbuildingMacro
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;
  CONFIG.Token.documentClass = SimpleTokenDocument;
  CONFIG.Token.objectClass = SimpleToken;

  // Define document types
  CONFIG.Actor.typeLabels = {
    character: "ACTOR.TypeCharacter"
  };
  CONFIG.Item.typeLabels = {
    ancestry: "ITEM.TypeAncestry",
    circle: "ITEM.TypeCircle",
    skill: "ITEM.TypeSkill",
    expertise: "ITEM.TypeExpertise",
    virtue: "ITEM.TypeVirtue"
  };

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("sdkdite", SimpleActorSheet, { 
    makeDefault: true,
    types: ["character"],
    label: "ACTOR.TypeCharacter"
  });
  
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("sdkdite", SimpleItemSheet, { 
    makeDefault: true,
    types: ["ancestry", "circle", "skill", "expertise", "virtue"],
    label: "Default Item Sheet"
  });

  // Register system settings
  game.settings.register("sdkdite", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register compendium initialization setting
  game.settings.register("sdkdite", "compendiumsInitialized", {
    name: "Compendiums Initialized",
    scope: "world",
    type: Boolean,
    default: false,
    config: false
  });

  // Register initiative setting.
  game.settings.register("sdkdite", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d20",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("sdkdite", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if ( !isValid ) {
      if ( notify ) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  // Preload template partials
  await preloadHandlebarsTemplates();
});

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => createWorldbuildingMacro(data, slot));

/**
 * Update actors when items they reference are updated
 */
Hooks.on("updateItem", (item, changes, options, userId) => {
  // Check if this is an ancestry or circle item
  if (item.type !== "ancestry" && item.type !== "circle") return;
  
  // Find all actors that reference this item
  game.actors.forEach(actor => {
    let needsUpdate = false;
    
    // Check if actor references this ancestry
    if (item.type === "ancestry" && actor.system.ancestryId === item.id) {
      needsUpdate = true;
    }
    
    // Check if actor references this circle
    if (item.type === "circle" && actor.system.circleId === item.id) {
      needsUpdate = true;
    }
    
    // Re-render the actor sheet if it's open
    if (needsUpdate && actor.sheet?.rendered) {
      actor.sheet.render(false);
    }
  });
});

/**
 * Adds the actor template context menu.
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {

  // Define an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("documentId"));
      return !actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data("documentId"));
      actor.setFlag("sdkdite", "isTemplate", true);
    }
  });

  // Undefine an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("documentId"));
      return actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data("documentId"));
      actor.setFlag("sdkdite", "isTemplate", false);
    }
  });
});

/**
 * Adds the item template context menu.
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {

  // Define an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const item = game.items.get(li.data("documentId"));
      return !item.isTemplate;
    },
    callback: li => {
      const item = game.items.get(li.data("documentId"));
      item.setFlag("sdkdite", "isTemplate", true);
    }
  });

  // Undefine an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const item = game.items.get(li.data("documentId"));
      return item.isTemplate;
    },
    callback: li => {
      const item = game.items.get(li.data("documentId"));
      item.setFlag("sdkdite", "isTemplate", false);
    }
  });
});
