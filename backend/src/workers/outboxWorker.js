const Outbox = require('../models/Outbox');

// You can replace these with actual service integrations
async function sendToTelegram(payload) {
  console.log(`📤 Sending to Telegram:`, payload);
  // TODO: Integrate with Telegram Bot API
  return true;
}

async function sendToTwitter(payload) {
  console.log(`📤 Sending to Twitter:`, payload);
  // TODO: Integrate with Twitter API
  return true;
}

async function sendToEmail(payload) {
  console.log(`📤 Sending to Email:`, payload);
  // TODO: Integrate with Email service (Nodemailer)
  return true;
}

async function sendToWhatsApp(payload) {
  console.log(`📤 Sending to WhatsApp:`, payload);
  // TODO: Integrate with WhatsApp Business API
  return true;
}

const channelHandlers = {
  telegram: sendToTelegram,
  twitter: sendToTwitter,
  email: sendToEmail,
  whatsapp: sendToWhatsApp
};

async function processOutbox() {
  try {
    const pending = Outbox.getPending(10);
    
    if (pending.length === 0) {
      return;
    }

    console.log(`📤 Processing ${pending.length} outbox items...`);

    for (const item of pending) {
      try {
        const handler = channelHandlers[item.channel];
        
        if (!handler) {
          console.error(`❌ Unknown channel: ${item.channel}`);
          Outbox.markFailed(item.id);
          continue;
        }

        const success = await handler(item.payload);
        
        if (success) {
          Outbox.markSent(item.id);
          console.log(`✅ Sent outbox item ${item.id} to ${item.channel}`);
        } else {
          Outbox.markFailed(item.id);
          console.log(`❌ Failed to send outbox item ${item.id} to ${item.channel}`);
        }
      } catch (error) {
        console.error(`❌ Error processing outbox item ${item.id}:`, error.message);
        Outbox.markFailed(item.id);
      }
    }
  } catch (error) {
    console.error('❌ Error in outbox worker:', error.message);
  }
}

// Run every 30 seconds
setInterval(processOutbox, 30000);

// Run immediately on start
processOutbox();

console.log('📤 Outbox worker started (running every 30 seconds)');

module.exports = { processOutbox };
