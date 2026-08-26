require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { readDB, writeDB } = require('./db');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is missing — set it in your .env file');
}

const bot = new Telegraf(BOT_TOKEN);

// ---- User-facing: opens the Mini App ----
bot.start((ctx) => {
  ctx.reply(
    'Welcome! 🎬\nTap below to browse videos.',
    Markup.inlineKeyboard([Markup.button.webApp('📱 Open App', WEBAPP_URL)])
  );
});

// ---- Admin uploads: just send a video to the bot, no admin panel needed ----
// The caption you attach becomes the video's title.
bot.on('video', (ctx) => {
  if (ctx.chat.id !== ADMIN_ID) {
    return ctx.reply('❌ Only the admin can add videos.');
  }

  const fileId = ctx.message.video.file_id;
  const title = ctx.message.caption?.trim() || 'Untitled video';

  const db = readDB();
  const id = Date.now().toString();
  db.videos.push({ id, title, fileId, uploadedAt: new Date().toISOString() });
  writeDB(db);

  ctx.reply(`✅ Added!\nID: ${id}\nTitle: ${title}`);
});

// ---- Admin: list all videos and their IDs ----
bot.command('list', (ctx) => {
  if (ctx.chat.id !== ADMIN_ID) return;
  const db = readDB();
  if (!db.videos.length) return ctx.reply('No videos yet. Just send me one!');
  const text = db.videos.map((v) => `${v.id} — ${v.title}`).join('\n');
  ctx.reply(text);
});

// ---- Admin: /delete <id> ----
bot.command('delete', (ctx) => {
  if (ctx.chat.id !== ADMIN_ID) return;
  const id = ctx.message.text.split(' ')[1];
  if (!id) return ctx.reply('Usage: /delete <id>  (get IDs from /list)');

  const db = readDB();
  const before = db.videos.length;
  db.videos = db.videos.filter((v) => v.id !== id);
  writeDB(db);

  ctx.reply(db.videos.length < before ? '🗑️ Deleted.' : '⚠️ No video with that ID.');
});

module.exports = bot;
