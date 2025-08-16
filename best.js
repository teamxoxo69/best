const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const speakeasy = require('speakeasy');
const express = require('express');

const bot = new Telegraf('7639181873:AAENlXvx2bOxfo-gjL8W0yWyWTdTUhs476k');
const sessions = {};

// Admin configuration
const ADMIN_IDS = [2027448806]; // Your Telegram user ID
const bannedUsers = new Set();
const botStats = {
  totalUsers: new Set(),
  commandsUsed: {},
  startTime: Date.now(),
  bannedCount: 0
};

// Express server setup
const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bot is Running");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("✅ Web server started on port 3000");
});

// Admin check function
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

// Update stats function
function updateStats(userId, command) {
  botStats.totalUsers.add(userId);
  botStats.commandsUsed[command] = (botStats.commandsUsed[command] || 0) + 1;
}

// Check if user is banned
function isBanned(userId) {
  return bannedUsers.has(userId);
}

// Middleware to check banned users
bot.use((ctx, next) => {
  if (isBanned(ctx.from.id) && !isAdmin(ctx.from.id)) {
    return ctx.reply('🚫 You are banned from using this bot.');
  }
  return next();
});

function showMainMenu(ctx) {
  updateStats(ctx.from.id, 'main_menu');
  
  const keyboard = [
    [{ text: '📧 Temp Email' }, { text: '🥷 Name Gen' }],
    [{ text: '🔑 2FA Code' }, { text: '🛑 Stop' }]
  ];
  
  // Add admin button for admins
  if (isAdmin(ctx.from.id)) {
    keyboard.push([{ text: '👑 Admin Panel' }]);
  }
  
  return ctx.reply(
    '🔮 META GHOST\n📱 Mobile Optimized\n\n💬 Need help? DM @ghost_cipher\n\n🎯 Choose an option:',
    {
      reply_markup: {
        keyboard,
        resize_keyboard: true,
        one_time_keyboard: false,
        persistent: true
      }
    }
  );
}

// Admin Panel
function showAdminPanel(ctx) {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('❌ Access denied');
  }
  
  const uptime = Math.floor((Date.now() - botStats.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  ctx.reply(
    '👑 ADMIN PANEL\n\n' +
    `📊 Total Users: ${botStats.totalUsers.size}\n` +
    `⏱️ Uptime: ${hours}h ${minutes}m\n` +
    `🔧 Active Sessions: ${Object.keys(sessions).length}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Full Stats', callback_data: 'admin_stats' }],
          [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
          [{ text: '👥 User List', callback_data: 'admin_users' }],
          [{ text: '🧹 Clear Sessions', callback_data: 'admin_clear' }],
          [{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]
        ]
      }
    }
  );
}

const maleNames = [
  "Abdullah", "Abdul Rahman", "Ahmad", "Ahsan", "Akram", "Arif", "Ashraf", "Asif", "Aslam",
  "Fahim", "Farid", "Faisal", "Habib", "Hafiz", "Hamid", "Hasan", "Hasib", "Ibrahim", "Imran",
  "Jahangir", "Jamal", "Kamrul", "Khalid", "Mahmud", "Masud", "Mohammad", "Mustafa", "Nayeem", "Omar",
  "Rafiq", "Rashid", "Rashed", "Saiful", "Sajid", "Salim", "Tariq", "Zakir", "Yusuf", "Ismail",
  "Dawud", "Sulaiman", "Musa", "Harun", "Idris", "Nuh", "Lukman", "Yunus", "Zakariya", "Yahya",
  "Isa", "Ilyas", "Ayyub", "Uzair", "Dhul-Kifl", "Shuaib", "Hud", "Salih", "Abbas", "Anwar",
  "Nasir", "Rauf", "Rahmat", "Shafiq", "Salam", "Sabir", "Tahir", "Nadir", "Bashir", "Munir"
];

const femaleNames = [
  "Aisha", "Amina", "Ayesha", "Fatima", "Hafsa", "Halima", "Hasina", "Jannat", "Khadija", "Kulsum",
  "Lamia", "Marium", "Nasreen", "Nusrat", "Rabeya", "Rahima", "Rashida", "Rukshana", "Sadia", "Salma",
  "Shamima", "Sharmin", "Sumaiya", "Tahmina", "Tanjila", "Yasmin", "Zakia", "Zebunnesa", "Safia",
  "Ruqayyah", "Umm Salama", "Zaynab", "Hafsah", "Juwayriya", "Maymuna", "Sawda", "Safiya", "Umm Habiba",
  "Asma", "Umm Ayman", "Layla", "Nadia", "Samira", "Karima", "Nawal", "Bushra", "Dua", "Noor",
  "Iman", "Sabrina", "Marwa", "Safa", "Hawa", "Sumaya", "Rabab", "Thuraya", "Widad", "Zahara"
];

const maleSurnames = [
  "Hossain", "Ahmed", "Rahman", "Chowdhury", "Islam", "Mollah", "Sikder", "Miah", "Sarder",
  "Bhuiyan", "Talukder", "Mondol", "Biswas", "Patwary", "Mazumder", "Barua", "Sheikh", "Uddin", "Ali",
  "Ansari", "Qureshi", "Siddiqui", "Hashmi", "Rizvi", "Naqvi", "Gillani", "Chishti", "Baghdadi", "Farooqi"
];

const femaleSurnames = [
  "Rahman", "Sultana", "Khatun", "Akter", "Islam"
];

function generateRandomName(gender) {
  const firstNames = gender === 'male' ? maleNames : femaleNames;
  const surnames = gender === 'male' ? maleSurnames : femaleSurnames;
  
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = surnames[Math.floor(Math.random() * surnames.length)];
  
  return `${first} ${last}`;
}

function generateRandomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomUsername = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${randomUsername}@mailto.plus`;
}

bot.start((ctx) => {
  if (sessions[ctx.from.id]?.emailInterval) clearInterval(sessions[ctx.from.id].emailInterval);
  delete sessions[ctx.from.id];
  showMainMenu(ctx);
});

// Admin Panel Handler
bot.hears(['👑 Admin Panel', '👑 Admin'], (ctx) => {
  showAdminPanel(ctx);
});

bot.hears(['📧 Temp Email', '📧 Generate Temp Email'], async (ctx) => {
  updateStats(ctx.from.id, 'temp_email');
  
  try {
    const email = generateRandomEmail();
    const encodedEmail = encodeURIComponent(email);

    if (sessions[ctx.from.id]?.emailInterval) clearInterval(sessions[ctx.from.id].emailInterval);

    sessions[ctx.from.id] = {
      ...sessions[ctx.from.id],
      email,
      encodedEmail,
      seenMailIds: new Set(),
      emailInterval: setInterval(() => checkEmails(ctx.from.id), 5000)
    };

    await ctx.replyWithHTML(
      `📧 <b>Temp Email Generated</b>\n\n<code>${email}</code>\n\n🔄 Auto-checking every 5s`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Copy', callback_data: `copy_${email}` }],
            [{ text: '🏠 Menu', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  } catch (e) {
    ctx.reply('❌ Error: ' + e.message);
    setTimeout(() => showMainMenu(ctx), 1000);
  }
});

// Admin Actions
bot.action('admin_stats', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  const uptime = Math.floor((Date.now() - botStats.startTime) / 1000);
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  let statsText = `📊 BOT STATISTICS\n\n`;
  statsText += `👥 Total Users: ${botStats.totalUsers.size}\n`;
  statsText += `⏱️ Uptime: ${days}d ${hours}h ${minutes}m\n`;
  statsText += `🔧 Active Sessions: ${Object.keys(sessions).length}\n\n`;
  statsText += `📈 Command Usage:\n`;
  
  Object.entries(botStats.commandsUsed)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([cmd, count]) => {
      statsText += `• ${cmd}: ${count}\n`;
    });
  
  ctx.editMessageText(statsText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 Refresh', callback_data: 'admin_stats' }],
        [{ text: '⬅️ Back', callback_data: 'admin_panel' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

bot.action('admin_broadcast', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  sessions[ctx.from.id] = { ...sessions[ctx.from.id], awaitingBroadcast: true };
  
  ctx.editMessageText(
    '📢 BROADCAST MESSAGE\n\nSend the message you want to broadcast to all users:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'admin_panel' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

bot.action('admin_users', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  const userList = Array.from(botStats.totalUsers).slice(0, 20);
  let userText = `👥 USER LIST (showing ${userList.length}/${botStats.totalUsers.size})\n\n`;
  
  userList.forEach((userId, index) => {
    const hasSession = sessions[userId] ? '🟢' : '🔴';
    userText += `${index + 1}. ${hasSession} ${userId}\n`;
  });
  
  ctx.editMessageText(userText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Back', callback_data: 'admin_panel' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

bot.action('admin_clear', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  const clearedCount = Object.keys(sessions).length;
  
  // Clear all sessions except admin
  Object.keys(sessions).forEach(userId => {
    if (!isAdmin(parseInt(userId))) {
      if (sessions[userId]?.emailInterval) clearInterval(sessions[userId].emailInterval);
      delete sessions[userId];
    }
  });
  
  ctx.editMessageText(
    `🧹 SESSIONS CLEARED\n\nCleared ${clearedCount} sessions`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⬅️ Back', callback_data: 'admin_panel' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

bot.action('admin_panel', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  const uptime = Math.floor((Date.now() - botStats.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  ctx.editMessageText(
    '👑 ADMIN PANEL\n\n' +
    `📊 Total Users: ${botStats.totalUsers.size}\n` +
    `⏱️ Uptime: ${hours}h ${minutes}m\n` +
    `🔧 Active Sessions: ${Object.keys(sessions).length}`,
    {
      reply_markup: {
        inline_keyboard: [


[{ text: '📊 Full Stats', callback_data: 'admin_stats' }, { text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
          [{ text: '👥 User List', callback_data: 'admin_users' }, { text: '🧹 Clear Sessions', callback_data: 'admin_clear' }],
          [{ text: '🚫 Ban User', callback_data: 'admin_ban' }, { text: '✅ Unban User', callback_data: 'admin_unban' }],
          [{ text: '💾 Export Data', callback_data: 'admin_export' }, { text: '🔄 Restart Bot', callback_data: 'admin_restart' }],
          [{ text: '🏠 Back to Menu', callback_data: 'main_menu' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

// Ban User Handler
bot.action('admin_ban', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  sessions[ctx.from.id] = { ...sessions[ctx.from.id], awaitingBanUserId: true };
  
  ctx.editMessageText(
    '🚫 BAN USER\n\nSend the User ID you want to ban:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'admin_panel' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

// Unban User Handler
bot.action('admin_unban', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  sessions[ctx.from.id] = { ...sessions[ctx.from.id], awaitingUnbanUserId: true };
  
  ctx.editMessageText(
    '✅ UNBAN USER\n\nSend the User ID you want to unban:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'admin_panel' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

// Export Data Handler
bot.action('admin_export', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  const data = {
    totalUsers: Array.from(botStats.totalUsers),
    commandsUsed: botStats.commandsUsed,
    bannedUsers: Array.from(bannedUsers),
    startTime: botStats.startTime,
    currentTime: Date.now()
  };
  
  ctx.reply(`📊 BOT DATA EXPORT\n\n${JSON.stringify(data, null, 2)}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Back', callback_data: 'admin_panel' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

// Restart Bot Handler
bot.action('admin_restart', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  ctx.editMessageText(
    '🔄 RESTART BOT\n\nAre you sure you want to restart the bot?',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Yes, Restart', callback_data: 'admin_restart_confirm' }],
          [{ text: '❌ Cancel', callback_data: 'admin_panel' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

// Restart Confirmation
bot.action('admin_restart_confirm', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCbQuery('❌ Access denied');
  
  ctx.editMessageText('🔄 Restarting bot...');
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
  
  ctx.answerCbQuery();
});

async function checkEmails(userId) {
  const session = sessions[userId];
  if (!session?.encodedEmail) return;

  try {
    const listUrl = `https://tempmail.plus/api/mails?email=${session.encodedEmail}&limit=10&epin=`;
    const res = await axios.get(listUrl, { timeout: 5000 });
    const mailList = res.data.mail_list || [];

    for (const mail of mailList) {
      if (!session.seenMailIds.has(mail.mail_id)) {
        session.seenMailIds.add(mail.mail_id);
        await notifyNewEmail(userId, mail.mail_id);
      }
    }
  } catch (e) {
    console.error('Email check error:', e.message);
  }
}

async function notifyNewEmail(userId, mailId) {
  const session = sessions[userId];
  if (!session?.encodedEmail) return;

  try {
    const mailUrl = `https://tempmail.plus/api/mails/${mailId}?email=${session.encodedEmail}&epin=`;
    const res = await axios.get(mailUrl, { timeout: 5000 });
    const mail = res.data;
    const codes = mail.subject.match(/\b\d{4,8}\b/g) || [];

    const safeFrom = (mail.from || 'Unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 50);
    const safeSubject = (mail.subject || 'No Subject').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 80);
    const fullText = (mail.text || 'No content').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let message = `📨 <b>NEW EMAIL ARRIVED!</b> 📨\n━━━━━━━━━━━━━━━━━━━━━\n📤 <b>From:</b> <code>${safeFrom}</code>\n📄 <b>Subject:</b> <code>${safeSubject}</code>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    
    const buttons = [];
    if (codes.length) {
      message += `🔑 <b>Codes:</b> ${codes.join(', ')}`;
      codes.forEach(code => {
        buttons.push([{ text: `📋 ${code}`, callback_data: `copy_${code}` }]);
      });
    } else {
      const maxLength = 3500;
      if (fullText.length > maxLength) {
        message += `📝 <b>Content:</b>\n<code>${fullText.substring(0, maxLength)}...</code>`;
        
        buttons.push([{ text: '📄 Full Content', callback_data: `full_${mailId}` }]);
        
        if (!session.fullEmails) session.fullEmails = {};
        session.fullEmails[mailId] = fullText;
      } else {
        message += `📝 <b>Content:</b>\n<code>${fullText}</code>`;
      }
    }
    
    buttons.push([{ text: '🗑️ Delete', callback_data: `delete_${mailId}` }, { text: '🏠 Menu', callback_data: 'main_menu' }]);

    try {
      await bot.telegram.sendMessage(userId, message, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (error) {
      if (error.response?.error_code === 403) {
        if (sessions[userId]?.emailInterval) clearInterval(sessions[userId].emailInterval);
        delete sessions[userId];
        console.log(`User ${userId} blocked the bot, session cleaned up`);
      } else {
        console.error('Failed to send email notification:', error.message);
      }
    }
  } catch (e) {
    console.error('Failed to fetch email:', e.message);
  }
}

bot.hears(['🥷 Name Gen', '🥷 Name Generator'], (ctx) => {
  updateStats(ctx.from.id, 'name_gen');
  
  ctx.reply('👤 Select gender:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '♂️ Male', callback_data: 'gen_male' }, { text: '♀️ Female', callback_data: 'gen_female' }],
          [{ text: '🏠 Menu', callback_data: 'main_menu' }]
        ]
      }
    }
  );
});

bot.action('gen_male', (ctx) => {
  const name = generateRandomName('male');
  ctx.editMessageText(`♂️ <b>Male Name:</b>\n\n<code>${name}</code>`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 Generate', callback_data: 'gen_male' }, { text: '📋 Copy', callback_data: `copy_${name}` }],
        [{ text: '🏠 Menu', callback_data: 'main_menu' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

bot.action('gen_female', (ctx) => {
  const name = generateRandomName('female');
  ctx.editMessageText(`♀️ <b>Female Name:</b>\n\n<code>${name}</code>`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 Generate', callback_data: 'gen_female' }, { text: '📋 Copy', callback_data: `copy_${name}` }],
        [{ text: '🏠 Menu', callback_data: 'main_menu' }]
      ]
    }
  });
  ctx.answerCbQuery();
});

bot.hears(['🔑 2FA Code', '🔑 Generate 2FA Code'], (ctx) => {
  updateStats(ctx.from.id, '2fa_code');
  
  sessions[ctx.from.id] = { ...sessions[ctx.from.id], awaiting2FA: true };
  ctx.replyWithHTML(
    '🔢 <b>Enter 2FA Secret:</b>\n\n📝 Example:\n<code>S6WO BQXK HVOV EQR6</code>\n\n👤 Bot by @ghost_cipher',
    {
      reply_markup: {
        keyboard: [
          [{ text: '📧 Temp Email' }, { text: '🥷 Name Gen' }],
          [{ text: '🔑 2FA Code' }, { text: '🛑 Stop' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        persistent: true,
        input_field_placeholder: 'Paste your 2FA secret here...'
      }
    }
  );
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  // Handle broadcast message from admin
  if (sessions[userId]?.awaitingBroadcast && isAdmin(userId)) {
    const broadcastMessage = ctx.message.text;
    let successCount = 0;
    let failCount = 0;
    
    for (const targetUserId of botStats.totalUsers) {
      try {
        await bot.telegram.sendMessage(targetUserId, `📢 <b>Admin Message:</b>\n\n${broadcastMessage}`, {
          parse_mode: 'HTML'
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
    
    delete sessions[userId].awaitingBroadcast;
    
    ctx.reply(`✅ Broadcast complete!\n\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👑 Admin Panel', callback_data: 'admin_panel' }]
        ]
      }
    });
    return;
  }

  // Handle ban user ID input from admin
  if (sessions[userId]?.awaitingBanUserId && isAdmin(userId)) {
    const targetUserId = parseInt(ctx.message.text);
    if (isNaN(targetUserId)) {
      ctx.reply('❌ Invalid User ID. Please send a valid number.');
      return;
    }
    
    if (isAdmin(targetUserId)) {
      ctx.reply('❌ Cannot ban an admin!');
      return;
    }
    
    bannedUsers.add(targetUserId);
    botStats.bannedCount++;
    delete sessions[userId].awaitingBanUserId;
    
    ctx.reply(`🚫 User ${targetUserId} has been banned!`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👑 Admin Panel', callback_data: 'admin_panel' }]
        ]
      }
    });
    return;
  }

  // Handle unban user ID input from admin
  if (sessions[userId]?.awaitingUnbanUserId && isAdmin(userId)) {
    const targetUserId = parseInt(ctx.message.text);
    if (isNaN(targetUserId)) {
      ctx.reply('❌ Invalid User ID. Please send a valid number.');
      return;
    }
    
    if (bannedUsers.has(targetUserId)) {
      bannedUsers.delete(targetUserId);
      botStats.bannedCount--;
      ctx.reply(`✅ User ${targetUserId} has been unbanned!`);
    } else {
      ctx.reply(`❌ User ${targetUserId} is not banned.`);
    }
    
    delete sessions[userId].awaitingUnbanUserId;
    
    ctx.reply('Operation completed!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👑 Admin Panel', callback_data: 'admin_panel' }]
        ]
      }
    });
    return;
  }

  if (sessions[userId]?.awaiting2FA) {
    try {
      const secret = ctx.message.text.replace(/\s+/g, '').toUpperCase();
      if (!/^[A-Z2-7]+=*$/.test(secret)) throw new Error('Invalid characters');
      if (secret.length < 16) throw new Error('Too short (min 16 chars)');

      const token = speakeasy.totp({ secret, encoding: 'base32', step: 30, digits: 6 });
      const timeLeft = 30 - Math.floor(Date.now() / 1000 % 30);

      await ctx.replyWithHTML(
        `✅ <b>2FA Code (${timeLeft}s)</b>\n\n<code>${token}</code>`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '📧 Temp Email' }, { text: '🥷 Name Gen' }],
              [{ text: '🔑 2FA Code' }, { text: '🛑 Stop' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
            persistent: true,
            inline_keyboard: [
              [{ text: '📋 Copy', callback_data: `copy_${token}` }, { text: '🔄 Refresh', callback_data: 'refresh_2fa' }]
            ]
          }
        }
      );

      sessions[userId].twoFASecret = secret;
    } catch (e) {
      await ctx.replyWithHTML(`❌ <b>Error:</b> ${e.message}\n\n📝 Format: 16+ chars (A-Z, 2-7)`, {
        reply_markup: {
          keyboard: [
            [{ text: '📧 Temp Email' }, { text: '🥷 Name Gen' }],
            [{ text: '🔑 2FA Code' }, { text: '🛑 Stop' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
          persistent: true
        }
      });
    } finally {
      delete sessions[userId].awaiting2FA;
    }
  } else {
    showMainMenu(ctx);
  }
});

bot.action(/^copy_(.+)/, (ctx) => {
  ctx.answerCbQuery(`📋 Copied: ${ctx.match[1].substring(0, 20)}${ctx.match[1].length > 20 ? '...' : ''}`, { show_alert: false });
});

bot.action(/^full_(.+)/, async (ctx) => {
  const mailId = ctx.match[1];
  const userId = ctx.from.id;
  const session = sessions[userId];
  
  if (session?.fullEmails?.[mailId]) {
    const fullContent = session.fullEmails[mailId];
    const maxLength = 4000;
    
    if (fullContent.length > maxLength) {
      const chunks = [];
      for (let i = 0; i < fullContent.length; i += maxLength) {
        chunks.push(fullContent.substring(i, i + maxLength));
      }
      
      for (let i = 0; i < chunks.length; i++) {
        await ctx.reply(`📄 <b>Email Content (${i + 1}/${chunks.length}):</b>\n\n<code>${chunks[i]}</code>`, {
          parse_mode: 'HTML'
        });
      }
    } else {
      await ctx.reply(`📄 <b>Full Email Content:</b>\n\n<code>${fullContent}</code>`, {
        parse_mode: 'HTML'
      });
    }
    
    ctx.answerCbQuery('📄 Full content sent');
  } else {
    ctx.answerCbQuery('❌ Content not available', { show_alert: true });
  }
});

bot.action('refresh_2fa', async (ctx) => {
  const secret = sessions[ctx.from.id]?.twoFASecret;
  if (!secret) return ctx.answerCbQuery('❌ No active session', { show_alert: true });

  const newToken = speakeasy.totp({ secret, encoding: 'base32' });
  const timeLeft = 30 - Math.floor(Date.now() / 1000 % 30);
  
  await ctx.editMessageText(
    `🔄 <b>New 2FA Code (${timeLeft}s)</b>\n\n<code>${newToken}</code>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Copy', callback_data: `copy_${newToken}` }, { text: '🔄 Refresh', callback_data: 'refresh_2fa' }]
        ]
      }
    }
  );
  ctx.answerCbQuery();
});

bot.action('main_menu', (ctx) => {
  ctx.deleteMessage().catch(() => {});
  showMainMenu(ctx);
  ctx.answerCbQuery();
});

bot.hears(['🛑 Stop', '🛑 Stop Session'], (ctx) => {
  const userId = ctx.from.id;
  if (sessions[userId]?.emailInterval) clearInterval(sessions[userId].emailInterval);
  delete sessions[userId];
  ctx.reply('✅ Session stopped', {
    reply_markup: {
      inline_keyboard: [[{ text: '🔄 Restart', callback_data: 'main_menu' }]]
    }
  });
});

bot.action(/^delete_(.+)/, (ctx) => {
  ctx.deleteMessage().catch(() => {});
  ctx.answerCbQuery('🗑️ Message deleted');
});

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  if (err.response?.error_code === 403) {
    const userId = ctx.from?.id;
    if (userId && sessions[userId]?.emailInterval) {
      clearInterval(sessions[userId].emailInterval);
      delete sessions[userId];
      console.log(`User ${userId} blocked the bot, session cleaned up`);
    }
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('📱 Mobile-optimized Telegram bot started with Admin Panel!');
