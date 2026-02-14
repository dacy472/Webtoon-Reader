// Library Page — Saved webtoons grid with progress + refresh

import { libraryApi } from '../api.js';
import { showToast } from '../main.js';

export async function renderLibrary(container) {
  try {
    const items = await libraryApi.getAll();

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 class="page-title"><span class="page-title-gradient">Library</span></h1>
          <p class="page-subtitle">Your saved webtoons and reading progress</p>
        </div>
        ${items.length > 0 ? `
          <button id="refresh-library" class="btn btn-secondary btn-sm" style="margin-top:4px;">
            🔄 Refresh Covers
          </button>
        ` : ''}
      </div>
      ${items.length === 0 ? renderEmpty() : renderGrid(items)}
    `;

    // Refresh button
    document.getElementById('refresh-library')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Refreshing...';

      try {
        const result = await libraryApi.refreshAll();
        showToast(`Updated ${result.updated} of ${result.total} item(s)`);
        // Re-render with fresh data
        await renderLibrary(container);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '🔄 Refresh Covers';
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title"><span class="page-title-gradient">Library</span></h1>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Failed to load library</p>
        <p class="empty-state-sub">${err.message}</p>
      </div>
    `;
  }
}

function renderEmpty() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">📚</div>
      <p class="empty-state-text">Your library is empty</p>
      <p class="empty-state-sub">Browse sources and add webtoons to get started</p>
      <br/>
      <a href="#/browse" class="btn btn-primary">Browse Sources</a>
    </div>
  `;
}

function renderGrid(items) {
  const cards = items.map(item => {
    const hasProgress = item.lastChapterTitle;
    return `
      <div class="webtoon-card" onclick="window.location.hash='#/detail/${item.sourceId}/${item.id}'">
        <div class="card-cover">
          <img src="${item.cover}" alt="${item.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${item.id}/300/420'" />
        </div>
        <div class="card-info">
          <div class="card-title">${item.title}</div>
          <div class="card-source">${item.sourceId}</div>
          ${hasProgress ? `
            <div style="margin-top:6px; font-size:0.72rem; color: var(--accent-primary-hover);">
              📖 ${item.lastChapterTitle}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="webtoon-grid">${cards}</div>`;
}
