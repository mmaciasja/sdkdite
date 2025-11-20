/**
 * Roll handling for the sdkdite system
 */

/**
 * Perform a stat roll with dialog
 * @param {Actor} actor - The actor performing the roll
 * @param {string} statName - The name of the stat being rolled
 * @param {number} statValue - The value of the stat
 * @param {number} statMod - The modifier for the stat
 */
export async function rollStat(actor, statName, statValue, statMod) {
  // Dialog options HTML
  let options = `
  <style>
    .roll-dialog-content {
      background: #d9d9d9;
      border: 1px solid black;
      padding: 20px;
      position: relative;
      font-family: 'Inter', sans-serif;
    }
    .roll-dialog-title {
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      color: black;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid black;
    }
    .roll-dialog-inputs {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30px;
      gap: 15px;
    }
    .roll-input-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .roll-input-group label {
      font-size: 12px;
      color: black;
      margin-bottom: 8px;
      text-align: center;
      font-weight: normal;
    }
    .roll-input-group input {
      width: 50px;
      height: 50px;
      background: #d9d9d9;
      border: 1px solid black;
      border-radius: 5px;
      text-align: center;
      font-size: 20px;
      color: black;
    }
    .roll-button-container {
      display: flex;
      justify-content: center;
    }
    .roll-button {
      background: #d9d9d9;
      border: 1px solid black;
      border-radius: 5px;
      padding: 15px 60px;
      font-size: 28px;
      font-weight: bold;
      color: black;
      cursor: pointer;
    }
    .roll-button:hover {
      background: #c9c9c9;
    }
  </style>
  <div class="roll-dialog-content">
    <div class="roll-dialog-title">Rolling ${statName}</div>
    <div class="roll-dialog-inputs">
      <div class="roll-input-group">
        <label for="roll-threshold">Threshold</label>
        <input id="roll-threshold" type="number" value="${statValue}" disabled/>
      </div>
      <div class="roll-input-group">
        <label for="success-modifier">Bonus</label>
        <input id="success-modifier" type="number" value="0" />
      </div>
      <div class="roll-input-group">
        <label for="roll-advantages">Advantages</label>
        <input id="roll-advantages" type="number" value="0" />
      </div>
      <div class="roll-input-group">
        <label for="roll-disadvantages">Disadvantages</label>
        <input id="roll-disadvantages" type="number" value="0" />
      </div>
    </div>
  </div>
  `;
  
  new Dialog({
    title: ` `,
    content: options,
    buttons: {
      roll: {
        label: `ROLL`,
        callback: async (html) => {
          let numAdv = parseInt(html.find("input[id='roll-advantages']").val());
          let numDis = parseInt(html.find("input[id='roll-disadvantages']").val());
          let threshold = parseInt(html.find("input[id='roll-threshold']").val());
          let modifier = parseInt(html.find("input[id='success-modifier']").val());
          let differenceAdvDis = numAdv - numDis;
          let totalDices = 2 + Math.abs(differenceAdvDis);
          let dieSize = "d10";
          
          let formula;
          if(differenceAdvDis == 0){
            formula = `${threshold}-(${totalDices}${dieSize})+${statValue}+${statMod}+${modifier}`;
          } else if(differenceAdvDis > 0){
            formula = `${threshold}-(${totalDices}${dieSize}kl2)+${statValue}+${statMod}+${modifier}`;
          } else {
            formula = `${threshold}-(${totalDices}${dieSize}kh2)+${statValue}+${statMod}+${modifier}`;
          }
          
          // Evaluate and send roll
          let roll = await new Roll(formula).evaluate();
          await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: `${statName} Roll (Value: ${statValue}, Mod: ${statMod})`,
            rollMode: game.settings.get("core", "rollMode")
          });
        }
      },
    },
  }, {
    width: 525,
    height: 290,
    classes: ["roll-stat-dialog"]
  }).render(true);
}
