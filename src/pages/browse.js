// Browse Page — Tabbed UI (Sources / Extensions)

import { extensions } from '../api.js';
import { showToast } from '../main.js';

let activeTab = 'sources'; // Default tab

export async function renderBrowse(container) {
  try {
    const [exts, repoData] = await Promise.all([
      extensions.list(),
      extensions.repo().catch(() => ({ extensions: [] })),
    ]);

    // Check URL params for tab? (simple check)
    if (window.location.hash.includes('tab=extensions')) {
      activeTab = 'extensions';
    }

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="page-title-gradient">Browse</span></h1>
      </div>

      <div class="tab-bar">
        <button class="tab ${activeTab === 'sources' ? 'active' : ''}" data-tab="sources">
          Sources
          <span class="tab-count">${exts.length}</span>
        </button>
        <button class="tab ${activeTab === 'extensions' ? 'active' : ''}" data-tab="extensions">
          Extensions
          <span class="tab-count">${repoData.extensions?.length || 0}</span>
        </button>
        <!-- Placeholder for Migrate tab if needed -->
        <!-- <button class="tab" disabled>Migrate</button> -->
      </div>

      <div id="tab-content"></div>
    `;

    // Tab switching
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab.disabled) return;
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
        renderTabContent(container, exts, repoData);
      });
    });

    renderTabContent(container, exts, repoData);
  } catch (err) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="page-title-gradient">Browse</span></h1>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Failed to load extensions</p>
        <p class="empty-state-sub">${err.message}</p>
      </div>
    `;
  }
}

function renderTabContent(container, exts, repoData) {
  const tabContent = document.getElementById('tab-content');
  if (!tabContent) return;

  if (activeTab === 'extensions') {
    renderExtensionsTab(tabContent, repoData, container);
  } else {
    renderSourcesTab(tabContent, exts, container);
  }
}

// ===== EXTENSIONS TAB (Formerly Available) =====
function renderExtensionsTab(tabContent, repoData, rootContainer) {
  const repoExts = repoData.extensions || [];

  if (repoExts.length === 0) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌐</div>
        <p class="empty-state-text">No extensions available</p>
        <p class="empty-state-sub">The extension repository is empty or could not be reached</p>
      </div>
    `;
    return;
  }

  tabContent.innerHTML = `
    <div class="repo-header">
      <div>
        <div class="repo-name">${repoData.name || 'Extension Repository'}</div>
        <div class="repo-desc">${repoData.description || ''}</div>
      </div>
    </div>
    <div id="repo-ext-list">
      ${repoExts.map(renderRepoExtCard).join('')}
    </div>
  `;

  // Install buttons
  tabContent.querySelectorAll('.repo-install-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const repoId = btn.dataset.repoId;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Installing...';

      try {
        await extensions.installFromRepo(repoId);
        showToast('Extension installed!');
        // Re-render the whole page to update both tabs
        await renderBrowse(rootContainer);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Install';
      }
    });
  });
}

function renderRepoExtCard(ext) {
  const isTachi = ext.format === 'tachiyomi';
  return `
    <div class="ext-card repo-ext-card ${isTachi ? 'tachi-card' : ''}">
      <div class="ext-info">
        <div class="ext-icon">${ext.icon || '🌐'}</div>
        <div style="flex:1;">
          <div class="ext-name">
            ${ext.name}
            ${ext.nsfw ? '<span class="tag tag-nsfw">18+</span>' : ''}
          </div>
          <div class="ext-description">${ext.description || ''}</div>
          <div class="ext-meta">${ext.lang?.toUpperCase() || 'EN'} · v${ext.version || '1.0'}${isTachi ? ' · APK' : ''}</div>
        </div>
      </div>
      <div class="ext-actions">
        ${isTachi
      ? `<span class="btn btn-secondary btn-sm tag-tachi" style="opacity:0.5; pointer-events:none; font-size:0.7rem;">📱 Info Only</span>`
      : ext.installed
        ? `<span class="btn btn-secondary btn-sm" style="opacity:0.6; pointer-events:none;">✓ Installed</span>`
        : `<button class="btn btn-primary btn-sm repo-install-btn" data-repo-id="${ext.id}">Install</button>`
    }
      </div>
    </div>
  `;
}

// ===== SOURCES TAB (Formerly Installed) =====
function renderSourcesTab(tabContent, exts, rootContainer) {
  tabContent.innerHTML = `
    <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
      <button id="reload-exts" class="btn btn-secondary btn-sm">🔄 Reload All</button>
      <button id="show-install" class="btn btn-secondary btn-sm">📎 Install from URL</button>
    </div>

    <!-- Install from URL form (hidden) -->
    <div id="install-form" style="display:none; margin-bottom:20px; padding:16px 20px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md);">
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <input id="ext-url" class="input-field" type="text" placeholder="Paste extension URL (.js file)" style="flex:1; min-width:260px;" />
        <button id="install-url-btn" class="btn btn-primary btn-sm">Install</button>
        <button id="cancel-install" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>

    <div id="installed-ext-list">
      ${exts.length === 0
      ? `<div class="empty-state">
             <div class="empty-state-icon">📦</div>
             <p class="empty-state-text">No sources installed</p>
             <p class="empty-state-sub">Switch to the Extensions tab to find and install sources</p>
           </div>`
      : exts.map(renderSourceCard).join('')
    }
    </div>
  `;

  // Show/hide URL install form
  document.getElementById('show-install')?.addEventListener('click', () => {
    document.getElementById('install-form').style.display = '';
  });
  document.getElementById('cancel-install')?.addEventListener('click', () => {
    document.getElementById('install-form').style.display = 'none';
  });

  // Install from URL
  document.getElementById('install-url-btn')?.addEventListener('click', async () => {
    const url = document.getElementById('ext-url').value.trim();
    if (!url) return;
    try {
      await extensions.install({ url });
      showToast('Extension installed!');
      await renderBrowse(rootContainer);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Reload all
  document.getElementById('reload-exts')?.addEventListener('click', async () => {
    try {
      const result = await extensions.reload();
      showToast(`Reloaded ${result.count} extensions`);
      await renderBrowse(rootContainer);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Remove buttons - need to handle separately from card click
  tabContent.querySelectorAll('.ext-remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // prevent card click
      const id = btn.dataset.extId;
      if (!confirm('Remove this source?')) return;
      try {
        await extensions.remove(id);
        showToast('Source removed');
        await renderBrowse(rootContainer);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function renderSourceCard(ext) {
  // Whole card is clickable to go to detail
  return `
    <div class="ext-card source-card" onclick="window.location.hash='#/source/${ext.id}'" style="cursor:pointer;">
      <div class="ext-info">
        <div class="ext-icon">${ext.icon}</div>
        <div>
          <div class="ext-name">${ext.name}</div>
          <div class="ext-meta">${ext.baseUrl} · ${ext.lang.toUpperCase()}</div>
        </div>
      </div>
      <div class="ext-actions">
        <!-- Browse button removed since card is clickable -->
        <button class="btn btn-danger btn-sm ext-remove-btn" data-ext-id="${ext.id}">Remove</button>
      </div>
    </div>
  `;
}
