# Video Vault — Telegram Mini App

Watch an Adsgram ad → get a video delivered straight to your Telegram chat.
No file storage, no admin panel — you upload videos by simply sending them
to your own bot.

## How it works

1. You (admin) send a video to your bot in a private chat, with a caption
   as the title. The bot saves its `file_id` — Telegram hosts the actual
   file, so this app never stores video data itself.
2. A user opens the Mini App and sees a list of video titles.
3. They tap **Watch Ad & Unlock** → an Adsgram ad plays.
4. Once the ad finishes, the backend verifies the request really came from
   Telegram, then re-sends that video to the user's own chat with the bot.

## Project structure

```
telegram-video-app/
├── server.js        # Express API + serves the frontend
├── bot.js            # Telegram bot: /start, video uploads, admin commands
├── db.js              # Tiny JSON-file "database"
├── package.json
├── .env.example       # Copy to .env and fill in your own values
└── public/
    ├── index.html      # Mini App page
    ├── style.css
    └── app.js           # Adsgram + Telegram WebApp logic
```

---

## 1. Local setup (VS Code)

1. Open this folder in VS Code.
2. Open the built-in terminal (`` Ctrl+` ``) and run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values (see step 2 below
   for how to get each one).
4. Run it:
   ```bash
   npm start
   ```
   You should see `Server running on port 3000`.

> Telegram only allows **HTTPS** URLs for Mini Apps, so you can't fully
> test the app inside Telegram while running on `localhost`. For quick
> local testing you can tunnel it with [ngrok](https://ngrok.com)
> (`ngrok http 3000`) and use that temporary URL as `WEBAPP_URL`. For real
> use, deploy to Render (step 3) and use that URL permanently.

## 2. Create your bot and get your IDs

1. In Telegram, message **@BotFather** → `/newbot` → follow the prompts →
   copy the token it gives you into `BOT_TOKEN`.
2. Message **@userinfobot** to get your own numeric Telegram ID → put it
   in `ADMIN_ID`. Only this ID can upload/delete videos.
3. Leave `WEBAPP_URL` for now — you'll fill it in after deploying.

## 3. Deploy to Render (free)

1. Push this folder to a new GitHub repo.
2. On [render.com](https://render.com), click **New → Web Service**,
   connect that repo.
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Under **Environment**, add `BOT_TOKEN`, `ADMIN_ID`, and a placeholder
   `WEBAPP_URL` (you'll fix it next).
5. Deploy. Render gives you a URL like `https://your-app-name.onrender.com`.
6. Go back to Environment, set `WEBAPP_URL` to that exact URL, save —
   Render restarts the service automatically.

## 4. Keep it awake with UptimeRobot

Render's free tier sleeps after ~15 minutes of no traffic, which would
delay the bot's replies.

1. Create a free account at [uptimerobot.com](https://uptimerobot.com).
2. Add a new **HTTP(s)** monitor:
   - URL: `https://your-app-name.onrender.com/health`
   - Interval: every 5 minutes
3. Save. This keeps your service always warm.

## 5. Connect the Mini App button in Telegram

1. Message **@BotFather** → `/mybots` → select your bot → **Bot Settings**
   → **Menu Button** → **Configure menu button** → paste your `WEBAPP_URL`.

Now your bot has both a persistent menu button and the `/start` inline
button opening the app.

## 6. Set up Adsgram

1. Register at [partner.adsgram.ai](https://partner.adsgram.ai) and add
   your Mini App using the same `WEBAPP_URL`.
2. Copy the **blockId** it gives you.
3. In `public/app.js`, replace:
   ```js
   const ADSGRAM_BLOCK_ID = 'your-block-id';
   ```
   with your real blockId, commit, and push — Render redeploys
   automatically.

## 7. Add your first video

Just open a private chat with your own bot and send it a video, with a
caption as the title. You'll get a confirmation with the video's ID.

Useful admin commands (only work for your `ADMIN_ID`):
- `/list` — see all videos and their IDs
- `/delete <id>` — remove a video

---

## Cloning this for a different app

Since everything configurable lives in `.env` and one constant in
`app.js`, making a second, independent app is just:

1. Copy this whole folder (or `git clone` it again) into a new folder.
2. Create a **new** bot via BotFather → new `BOT_TOKEN`.
3. Update `.env` with the new token, your `ADMIN_ID`, and a new
   `WEBAPP_URL` once deployed.
4. Deploy as a **new** Render service (different name → different URL).
5. Register that new URL as a separate app on Adsgram → new blockId →
   update `app.js`.

No other code changes needed — the two apps run fully independently.

## Notes & limits

- Videos aren't stored on your server at all — Telegram hosts them via
  `file_id`, so there's no disk/storage cost or size headache on your end.
- `db.json` holds video metadata only (title, id, file_id). Back it up if
  you care about not losing your video list on redeploy.
- The unlock endpoint verifies Telegram's `initData` signature, so it
  can't be called successfully from outside the actual Mini App.
