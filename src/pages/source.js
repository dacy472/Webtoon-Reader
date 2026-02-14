// Source Detail Page — Webtoon grid for a specific source

import { extensions, source } from '../api.js';
import { showToast } from '../main.js';

export async function renderSourcePage(container, params) { // Renamed from renderSource
  // ID from URL params
  console.log('renderSourcePage params:', params);
  const currentExtId = params?.id;

  // DEBUG: Show ID to user
  // showToast(`DEBUG: Source ID = ${currentExtId}`);

  if (!currentExtId) {
    container.innerHTML = '<div class="error-state">No source specified</div>';
    return;
  }

  // Local state for this render
  let currentPage = 1;
  let searchQuery = '';

  try {
    const exts = await extensions.list();
    const ext = exts.find(e => e.id === currentExtId);

    if (!ext) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p class="empty-state-text">Source not found</p>
                    <p class="empty-state-sub">The extension "${currentExtId}" is not installed or invalid.</p>
                     <br/>
                    <a href="#/browse" class="btn btn-primary">Go Back</a>
                </div>`;
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="header-row" style="display:flex; align-items:center; gap:12px;">
            <button class="btn-icon" onclick="history.back()">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 class="page-title"><span class="page-title-gradient">${ext.name}</span></h1>
        </div>
      </div>

      <div class="search-bar">
        <input id="search-input" class="input-field" type="text" placeholder="Search ${ext.name}..." value="${searchQuery}" />
        <button id="search-btn" class="btn btn-primary btn-sm">Search</button>
      </div>

      <div id="browse-grid" class="webtoon-grid"></div>
      <div id="browse-more" class="load-more"></div>
    `;

    // Events
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const grid = document.getElementById('browse-grid');
    const more = document.getElementById('browse-more');

    // Grid Event Delegation for Card Clicks
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.webtoon-card');
      if (card) {
        const webtoonId = card.dataset.id;
        if (webtoonId && currentExtId) {
          window.location.hash = `#/detail/${currentExtId}/${webtoonId}`;
        }
      }
    });

    const triggerLoad = async (append = false) => {
      await loadWebtoons(grid, more, currentExtId, searchQuery, currentPage, append, (p) => currentPage = p);
    };

    searchBtn.addEventListener('click', () => {
      searchQuery = searchInput.value.trim();
      currentPage = 1;
      triggerLoad();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        triggerLoad();
      }
    });

    // Load initial data
    await triggerLoad();

  } catch (err) {
    container.innerHTML = `
      <div class="page-header">
        <button class="btn-icon" onclick="history.back()">←</button>
        <h1 class="page-title">Error</h1>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Failed to load source</p>
        <p class="empty-state-sub">${err.message}</p>
      </div>
    `;
  }
}

async function loadWebtoons(grid, moreContainer, extId, query, page, append, setPage) {
  if (!grid) return;

  if (!append) {
    grid.innerHTML = '<div class="loader" style="grid-column:1/-1"><div class="spinner"></div></div>';
  }

  try {
    let result;
    if (extId === '[object Object]') {
      throw new Error('Critical Error: extId IS OBJECT? This should not happen.');
    }

    if (query) {
      result = await source.search(extId, query, page);
    } else {
      result = await source.popular(extId, page);
    }

    const cards = result.webtoons.map(w => `
      <div class="webtoon-card" data-id="${w.id}">
        <div class="card-cover">
          <img src="${w.cover}" alt="${w.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${w.id}/300/420'" />
        </div>
        <div class="card-info">
          <div class="card-title">${w.title}</div>
        </div>
      </div>
    `).join('');

    if (append) {
      grid.insertAdjacentHTML('beforeend', cards);
    } else {
      grid.innerHTML = cards;
    }

    if (result.webtoons.length === 0 && !append) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <p class="empty-state-text">No webtoons found</p>
          <p class="empty-state-sub">${query ? `No results for "${query}"` : 'This source has no popular webtoons'}</p>
        </div>
      `;
    }

    // Load more button
    if (result.hasNext) {
      moreContainer.innerHTML = `<button class="btn btn-secondary" id="load-more-btn">Load More</button>`;
      document.getElementById('load-more-btn').addEventListener('click', () => {
        setPage(page + 1);
        loadWebtoons(grid, moreContainer, extId, query, page + 1, true, setPage);
      });
    } else {
      moreContainer.innerHTML = '';
    }
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Error loading webtoons</p>
        <p class="empty-state-sub">${err.message}</p>
      </div>
    `;
  }
}
