/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Actor tab templates
    "systems/sdkdite/templates/actor/tabs/tab-header.html",
    "systems/sdkdite/templates/actor/tabs/tab-general.html",
    "systems/sdkdite/templates/actor/tabs/tab-skills.html",
    "systems/sdkdite/templates/actor/tabs/tab-combat.html",
    "systems/sdkdite/templates/actor/tabs/tab-mask.html",
    "systems/sdkdite/templates/actor/tabs/tab-rhapsodies.html",
    "systems/sdkdite/templates/actor/tabs/tab-vulcanotech.html",
    "systems/sdkdite/templates/actor/tabs/tab-almakathir.html",
    "systems/sdkdite/templates/actor/tabs/tab-omniferis.html",
    "systems/sdkdite/templates/actor/tabs/tab-diary.html",
    "systems/sdkdite/templates/actor/tabs/tab-biography.html",
    "systems/sdkdite/templates/actor/tabs/tab-items.html",
    "systems/sdkdite/templates/actor/tabs/tab-attributes.html",
    
    // Partial templates
    "systems/sdkdite/templates/parts/sheet-attributes.html",
    "systems/sdkdite/templates/parts/sheet-groups.html"
  ];

  // Load the template parts
  return foundry.applications.handlebars.loadTemplates(templatePaths);
};