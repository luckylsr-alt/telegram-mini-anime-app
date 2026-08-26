const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Match Telegram's current theme (light/dark/custom) automatically
const theme = tg.themeParams || {};
document.documentElement.style.setProperty('--bg', theme.bg_color || '#ffffff');
document.documentElement.style.setProperty('--text', theme.text_color || '#111111');
document.documentElement.style.setProperty('--hint', theme.hint_color || '#999999');
document.documentElement.style.setProperty('--button', theme.button_color || '#2ea6ff');
document.documentElement.style.setProperty('--button-text', theme.button_text_color || '#ffffff');
document.documentElement.style.setProperty('--secondary-bg', theme.secondary_bg_color || '#f4f4f5');

// 👉 Replace with your real blockId from partner.adsgram.ai
const ADSGRAM_BLOCK_ID = '44702';
const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });

const listEl = document.getElementById('video-list');
const toastEl = document.getElementById('toast');

function showToast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.className = isError ? 'show error' : 'show';
  setTimeout(() => { toastEl.className = ''; }, 3500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    renderVideos(videos);
  } catch (e) {
    listEl.innerHTML = '<p class="loading">Could not load videos. Pull to refresh.</p>';
  }
}

function renderVideos(videos) {
  if (!videos.length) {
    listEl.innerHTML = '<p class="loading">No videos yet. Check back soon!</p>';
    return;
  }

  listEl.innerHTML = '';
  videos.forEach((v) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info"><h3>${escapeHtml(v.title)}</h3></div>
      <button class="unlock-btn" data-id="${v.id}">▶ Watch Ad & Unlock</button>
    `;
    listEl.appendChild(card);
  });

  document.querySelectorAll('.unlock-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleUnlock(btn));
  });
}

function handleUnlock(btn) {
  const videoId = btn.dataset.id;
  btn.disabled = true;
  btn.textContent = 'Loading ad…';

  AdController.show()
    .then(() => unlockVideo(videoId, btn))
    .catch(() => {
      showToast('Ad not available right now. Try again later.', true);
      resetButton(btn);
    });
}

async function unlockVideo(videoId, btn) {
  btn.textContent = 'Unlocking…';
  try {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData, videoId }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Something went wrong.');
    }

    showToast('🎬 Sent! Check your chat with the bot.');
    btn.textContent = '✅ Sent to chat';
  } catch (e) {
    showToast(e.message, true);
    resetButton(btn);
  }
}

function resetButton(btn) {
  btn.disabled = false;
  btn.textContent = '▶ Watch Ad & Unlock';
}

loadVideos();

