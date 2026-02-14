// Settings Page — Theme, Repo URL, Cache, Backup/Restore

import { settingsApi } from '../api.js';
import { showToast } from '../main.js';

export async function renderSettings(container) {
  let currentSettings;
  try {
    currentSettings = await settingsApi.get();
  } catch {
    currentSettings = { theme: 'dark', repoUrl: '' };
  }

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title"><span class="page-title-gradient">Settings</span></h1>
      <p class="page-subtitle">Customize your Radiant Space experience</p>
    </div>

    <!-- Appearance -->
    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">🎨</span>
        <h2 class="settings-section-title">Appearance</h2>
      </div>
      <div class="settings-group">
        <label class="settings-label">Theme</label>
        <div class="theme-selector">
          ${['dark', 'light', 'amoled'].map(t => `
            <button class="theme-btn ${currentSettings.theme === t ? 'active' : ''}" data-theme="${t}">
              <span class="theme-preview theme-preview-${t}"></span>
              <span>${t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Extension Repository -->
    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">🌐</span>
        <h2 class="settings-section-title">Extension Repository</h2>
      </div>
      <div class="settings-group">
        <label class="settings-label">Custom Repository URL</label>
        <p class="settings-hint">Paste a GitHub raw URL to a repo.json or Tachiyomi index.min.json</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <input id="repo-url-input" class="input-field" type="text"
            placeholder="https://raw.githubusercontent.com/user/repo/main/repo.json"
            value="${currentSettings.repoUrl || ''}"
            style="flex:1; min-width:280px;" />
          <button id="save-repo-url" class="btn btn-primary btn-sm">Save</button>
          <button id="set-default-repo" class="btn btn-secondary btn-sm" title="Use built-in demo repository">Set Default</button>
          <button id="clear-repo-url" class="btn btn-secondary btn-sm">Reset</button>
        </div>
      </div>
    </div>

    <!-- Storage -->
    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">🗑️</span>
        <h2 class="settings-section-title">Storage</h2>
      </div>
      <div class="settings-group">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <label class="settings-label" style="margin-bottom:0;">Chapter Cache</label>
            <p class="settings-hint">Clear cached chapter data and temporary files</p>
          </div>
          <button id="clear-cache" class="btn btn-danger btn-sm">Clear Cache</button>
        </div>
      </div>
    </div>

    <!-- Backup & Restore -->
    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">💾</span>
        <h2 class="settings-section-title">Backup & Restore</h2>
      </div>
      <div class="settings-group">
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button id="export-backup" class="btn btn-secondary btn-sm">📤 Export Backup</button>
          <button id="import-backup" class="btn btn-secondary btn-sm">📥 Import Backup</button>
          <input id="backup-file-input" type="file" accept=".json" style="display:none;" />
        </div>
        <p class="settings-hint" style="margin-top:8px;">Export saves your library and settings. Import restores them from a backup file.</p>
      </div>
    </div>

    <!-- About -->
    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">✦</span>
        <h2 class="settings-section-title">About</h2>
      </div>
      <div class="settings-group">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <p class="settings-label" style="margin-bottom:0;">Radiant Space</p>
            <p class="settings-hint">Webtoon reader with installable extensions</p>
          </div>
          <span class="version-tag" style="font-size:0.8rem;">v1.0</span>
        </div>
      </div>
    </div>
  `;

  // --- Theme switching ---
  container.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const theme = btn.dataset.theme;
      container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(theme);
      try {
        await settingsApi.update({ theme });
        showToast(`Theme set to ${theme}`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // --- Save repo URL ---
  document.getElementById('save-repo-url')?.addEventListener('click', async () => {
    const url = document.getElementById('repo-url-input').value.trim();
    try {
      await settingsApi.update({ repoUrl: url });
      showToast('Repository URL saved! Go to Extensions → Available to see the results.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('clear-repo-url')?.addEventListener('click', async () => {
    document.getElementById('repo-url-input').value = '';
    try {
      await settingsApi.update({ repoUrl: '' });
      showToast('Repository URL reset (extensions hidden)');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('set-default-repo')?.addEventListener('click', async () => {
    const defaultUrl = `${window.location.origin}/api/extensions/repo/static/repo.json`;
    document.getElementById('repo-url-input').value = defaultUrl;
    try {
      await settingsApi.update({ repoUrl: defaultUrl });
      showToast('Set to default repository');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Clear cache ---
  document.getElementById('clear-cache')?.addEventListener('click', async () => {
    if (!confirm('Clear all cached data? This cannot be undone.')) return;
    try {
      const result = await settingsApi.clearCache();
      showToast(`Cleared ${result.filesCleared} cached file(s)`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Export backup ---
  document.getElementById('export-backup')?.addEventListener('click', async () => {
    try {
      const data = await settingsApi.backup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `radiant-space-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exported!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // --- Import backup ---
  const fileInput = document.getElementById('backup-file-input');
  document.getElementById('import-backup')?.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.library) throw new Error('Invalid backup file — no library data found');
      if (!confirm(`Restore backup? This will replace your current library (${data.library.length} items).`)) return;
      await settingsApi.restore(data);
      showToast(`Restored ${data.library.length} library items!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
    fileInput.value = '';
  });
}

// Apply theme CSS variables to <html>
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
