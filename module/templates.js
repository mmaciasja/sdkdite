/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Actor tab templates
    "systems/sdkdite/templates/actors/playable-character/tab-header.html",
    "systems/sdkdite/templates/actors/playable-character/tab-general.html",
    "systems/sdkdite/templates/actors/playable-character/tab-skills.html",
    "systems/sdkdite/templates/actors/playable-character/tab-combat.html",
    "systems/sdkdite/templates/actors/playable-character/tab-mask.html",
    "systems/sdkdite/templates/actors/playable-character/tab-rhapsodies.html",
    "systems/sdkdite/templates/actors/playable-character/tab-vulcanotech.html",
    "systems/sdkdite/templates/actors/playable-character/tab-almakathir.html",
    "systems/sdkdite/templates/actors/playable-character/tab-omniferis.html",
    "systems/sdkdite/templates/actors/playable-character/tab-diary.html",
    "systems/sdkdite/templates/actors/playable-character/tab-biography.html",
    "systems/sdkdite/templates/actors/playable-character/tab-items.html",
    "systems/sdkdite/templates/actors/playable-character/tab-attributes.html",
    
    // Item templates
    "systems/sdkdite/templates/item/ancestry-sheet.html",
    "systems/sdkdite/templates/item/circle-sheet.html",
    "systems/sdkdite/templates/item/skill-sheet.html",
    "systems/sdkdite/templates/item/experty-sheet.html",
    "systems/sdkdite/templates/item/virtue-sheet.html",
    
    // Partial templates
    "systems/sdkdite/templates/parts/sheet-attributes.html",
    "systems/sdkdite/templates/parts/sheet-groups.html"
  ];

  // Load the template parts
  return foundry.applications.handlebars.loadTemplates(templatePaths);
};