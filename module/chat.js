/**
 * Chat message utilities for the sdkdite system
 */

/**
 * Send an item card to chat
 * @param {Actor} actor - The actor who owns the item
 * @param {Item} item - The item to display
 * @param {Object} options - Additional options
 */
export async function sendItemToChat(actor, item, options = {}) {
  const itemData = item.system;
  const itemType = item.type;
  
  // Build the chat card content with inline height constraint
  let content = `
    <div class="sdkdite item-card ${itemType}-card" style="max-height: 250px; height: 250px; overflow: hidden; display: flex; flex-direction: column;">
      <header class="card-header" style="flex-shrink: 0;">
        <img src="${item.img}" alt="${item.name}" class="item-image" style="width: 35px; height: 35px; object-fit: cover;"/>
        <div class="item-title-section">
          <h3 class="item-name">${item.name}</h3>
          ${itemType === 'virtue' ? `<div class="item-meta">${itemData.branch || ''} - ${itemData.type || ''}</div>` : ''}
        </div>
      </header>
      <div class="card-content" style="flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0;">
  `;
  
  // Add description if exists
  if (itemData.description) {
    content += `
      <div class="card-section">
        <h4>Description</h4>
        <div class="description-text">${itemData.description}</div>
      </div>
    `;
  }
  
  // Type-specific content
  if (itemType === 'virtue') {
    // Show stat modifiers if any exist
    const modifiers = itemData.modifiers || {};
    const activeModifiers = Object.entries(modifiers).filter(([stat, value]) => value !== 0);
    
    if (activeModifiers.length > 0) {
      content += `
        <div class="card-section">
          <h4>Stat Modifiers</h4>
          <div class="modifiers-list">
            ${activeModifiers.map(([stat, value]) => {
              const sign = value > 0 ? '+' : '';
              const statDisplay = stat.charAt(0).toUpperCase() + stat.slice(1);
              return `<span class="modifier-item ${value > 0 ? 'positive' : 'negative'}">${statDisplay}: ${sign}${value}</span>`;
            }).join(' ')}
          </div>
        </div>
      `;
    }
    
    // Show mechanic if exists
    if (itemData.mechanic) {
      content += `
        <div class="card-section">
          <h4>Mechanic</h4>
          <div class="mechanic-text">${itemData.mechanic}</div>
        </div>
      `;
    }
  } else if (itemType === 'skill' || itemType === 'expertise') {
    // Skills and expertise just show description for now
    // Can be expanded later
  } else if (itemType === 'ancestry') {
    // Show base stats
    const baseStats = itemData.baseStats || {};
    const hasStats = Object.values(baseStats).some(v => v > 0);
    
    if (hasStats) {
      content += `
        <div class="card-section">
          <h4>Base Stats</h4>
          <div class="stats-list">
            ${Object.entries(baseStats)
              .filter(([stat, value]) => value > 0)
              .map(([stat, value]) => {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                return `<span class="stat-item">${statName}: ${value}</span>`;
              })
              .join(' ')}
          </div>
        </div>
      `;
    }
  } else if (itemType === 'circle') {
    // Show stat bonuses
    const stats = itemData.stats || {};
    const hasStats = Object.values(stats).some(v => v !== 0);
    
    if (hasStats) {
      content += `
        <div class="card-section">
          <h4>Stat Bonuses</h4>
          <div class="modifiers-list">
            ${Object.entries(stats)
              .filter(([stat, value]) => value !== 0)
              .map(([stat, value]) => {
                const sign = value > 0 ? '+' : '';
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                return `<span class="modifier-item ${value > 0 ? 'positive' : 'negative'}">${statName}: ${sign}${value}</span>`;
              })
              .join(' ')}
          </div>
        </div>
      `;
    }
  }
  
  content += `
      </div>
    </div>
  `;
  
  // Add CSS for the chat card
  const style = `
    <style>
      .chat-message .message-content .sdkdite.item-card {
        font-family: 'Inter', sans-serif;
        background: #f5f5f5;
        border: 2px solid black;
        border-radius: 5px;
        overflow: hidden;
        max-height: 250px !important;
        height: 250px;
        display: flex;
        flex-direction: column;
      }
      .chat-message .message-content .sdkdite.item-card .card-header {
        background: #d9d9d9;
        border-bottom: 2px solid black;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .chat-message .message-content .sdkdite.item-card .item-image {
        width: 35px;
        height: 35px;
        border: 1px solid black;
        border-radius: 3px;
        object-fit: cover;
        flex-shrink: 0;
      }
      .chat-message .message-content .sdkdite.item-card .item-title-section {
        flex: 1;
        min-width: 0;
      }
      .chat-message .message-content .sdkdite.item-card .item-name {
        margin: 0;
        font-size: 14px;
        font-weight: bold;
        color: black;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .chat-message .message-content .sdkdite.item-card .item-meta {
        font-size: 10px;
        color: #555;
        margin-top: 1px;
      }
      .chat-message .message-content .sdkdite.item-card .card-content {
        padding: 6px 8px;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .chat-message .message-content .sdkdite.item-card .card-section {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .chat-message .message-content .sdkdite.item-card .card-section h4 {
        margin: 0;
        font-size: 11px;
        font-weight: bold;
        color: black;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #999;
        padding-bottom: 2px;
      }
      .chat-message .message-content .sdkdite.item-card .description-text,
      .chat-message .message-content .sdkdite.item-card .mechanic-text,
      .chat-message .message-content .sdkdite.item-card .requirement-text {
        font-size: 11px;
        color: #333;
        line-height: 1.3;
      }
      .chat-message .message-content .sdkdite.item-card .modifiers-list,
      .chat-message .message-content .sdkdite.item-card .stats-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .chat-message .message-content .sdkdite.item-card .modifier-item,
      .chat-message .message-content .sdkdite.item-card .stat-item {
        background: white;
        border: 1px solid black;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
      }
      .chat-message .message-content .sdkdite.item-card .modifier-item.positive {
        color: #0a7c0a;
        border-color: #0a7c0a;
      }
      .chat-message .message-content .sdkdite.item-card .modifier-item.negative {
        color: #c93030;
        border-color: #c93030;
      }
    </style>
  `;
  
  // Create the chat message
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: style + content,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    ...options
  };
  
  return ChatMessage.create(chatData);
}
