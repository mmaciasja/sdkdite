/**
 * Initialize compendiums with default data
 */

export async function initializeCompendiums() {
  // Check if ancestries have already been initialized
  const setting = game.settings.get("sdkdite", "compendiumsInitialized");
  if (setting) {
    console.log("Compendiums already initialized");
    return;
  }

  console.log("Initializing ancestries compendium...");

  const pack = game.packs.get("sdkdite.ancestries");
  if (!pack) {
    console.error("Ancestries compendium not found!");
    return;
  }

  // Check if pack already has content
  const existingContent = await pack.getDocuments();
  if (existingContent.length > 0) {
    console.log("Ancestries compendium already has content");
    await game.settings.set("sdkdite", "compendiumsInitialized", true);
    return;
  }

  // Define ancestry data
  const ancestries = [
    {
      name: "Prosopo",
      type: "ancestry",
      img: "systems/sdkdite/styles/static/compendium/ancestries/prosopo/ancestry.svg",
      system: {
        description: "<p>Prosopo are the most common ancestry, known for their adaptability and balanced nature. They excel in social situations and are natural leaders.</p>",
        img: "",
        baseStats: {
          strength: 5,
          endurance: 5,
          dexterity: 5,
          charisma: 7,
          intelligence: 6
        },
        virtues: []
      }
    },
    {
      name: "Zoodis",
      type: "ancestry",
      img: "systems/sdkdite/styles/static/compendium/ancestries/zoodis/ancestry.svg",
      system: {
        description: "<p>Zoodis are animalistic and primal, possessing enhanced physical capabilities. They have a deep connection to nature and instinctual awareness.</p>",
        img: "",
        baseStats: {
          strength: 7,
          endurance: 6,
          dexterity: 7,
          charisma: 4,
          intelligence: 4
        },
        virtues: []
      }
    },
    {
      name: "Ascerbide",
      type: "ancestry",
      img: "systems/sdkdite/styles/static/compendium/ancestries/ascerbide/ancestry.svg",
      system: {
        description: "<p>Ascerbide are harsh and resilient, forged in adversity. They possess exceptional endurance and willpower, thriving in extreme conditions.</p>",
        img: "",
        baseStats: {
          strength: 6,
          endurance: 8,
          dexterity: 4,
          charisma: 5,
          intelligence: 5
        },
        virtues: []
      }
    },
    {
      name: "Katotero",
      type: "ancestry",
      img: "systems/sdkdite/styles/static/compendium/ancestries/katotero/ancestry.svg",
      system: {
        description: "<p>Katotero are mysterious and intellectual, possessing superior mental faculties. They are natural scholars and practitioners of the arcane arts.</p>",
        img: "",
        baseStats: {
          strength: 4,
          endurance: 4,
          dexterity: 5,
          charisma: 6,
          intelligence: 9
        },
        virtues: []
      }
    }
  ];

  // Create items in the compendium
  for (const ancestryData of ancestries) {
    await pack.documentClass.create(ancestryData, { pack: pack.collection });
    console.log(`Created ancestry: ${ancestryData.name}`);
  }

  // Mark as initialized
  await game.settings.set("sdkdite", "compendiumsInitialized", true);
  console.log("Ancestries compendium initialized successfully!");
}
