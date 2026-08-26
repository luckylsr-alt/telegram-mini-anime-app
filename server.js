require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const bot = require('./bot');
const { readDB } = require('./db');

const BOT_TOKEN = process.env.BOT_TOKEN;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Confirms a request really came from Telegram's WebApp (not a faked call).
// See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const userRaw = params.get('user');
  return userRaw ? JSON.parse(userRaw) : null;
}

// Video list for the app UI — file_id is never exposed to the frontend.
app.get('/api/videos', (req, res) => {
  const db = readDB();
  const videos = db.videos.map(({ id, title, uploadedAt }) => ({ id, title, uploadedAt }));
  res.json(videos);
});

// Called after the user finishes watching the Adsgram ad.
// Delivers the actual video as a direct message from the bot.
app.post('/api/unlock', async (req, res) => {
  const { initData, videoId } = req.body || {};
  const user = verifyInitData(initData || '');

  if (!user) {
    return res.status(401).json({ error: 'Invalid Telegram session — please reopen the app.' });
  }

  const db = readDB();
  const video = db.videos.find((v) => v.id === videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  try {
    await bot.telegram.sendVideo(user.id, video.fileId, { caption: `🎬 ${video.title}` });
    res.json({ success: true });
  } catch (err) {
    console.error('sendVideo failed:', err.message);
    res.status(500).json({ error: 'Could not deliver video. Send /start to the bot first, then try again.' });
  }
});

// Ping target for UptimeRobot — keeps Render's free tier from sleeping.
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
