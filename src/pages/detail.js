// Detail Page — Webtoon info + chapter list

import { source, libraryApi } from '../api.js';
import { showToast } from '../main.js';

export async function renderDetail(container, extId, webtoonId) {
    try {
        const [detail, libCheck] = await Promise.all([
            source.detail(extId, webtoonId),
            libraryApi.check(webtoonId, extId),
        ]);

        const statusClass = detail.status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-ongoing';

        container.innerHTML = `
      <div class="detail-hero">
        <div class="detail-cover">
          <img src="${detail.cover}" alt="${detail.title}" onerror="this.src='https://picsum.photos/seed/${detail.id}/300/420'" />
        </div>
        <div class="detail-info">
          <div class="detail-title">${detail.title}</div>
          <div class="detail-meta">
            ${detail.author ? `<span class="meta-tag">✍️ ${detail.author}</span>` : ''}
            ${detail.artist ? `<span class="meta-tag">🎨 ${detail.artist}</span>` : ''}
            ${detail.status ? `<span class="meta-tag ${statusClass}">${detail.status}</span>` : ''}
            ${(detail.genres || []).map(g => `<span class="meta-tag">${g}</span>`).join('')}
          </div>
          <p class="detail-description">${detail.description || 'No description available.'}</p>
          <div class="detail-actions">
            <button id="library-btn" class="btn ${libCheck.inLibrary ? 'btn-danger' : 'btn-primary'}">
              ${libCheck.inLibrary ? '❌ Remove from Library' : '📚 Add to Library'}
            </button>
            ${detail.chapters?.length > 0 ? `
              <button id="start-read-btn" class="btn btn-secondary" onclick="window.location.hash='#/read/${extId}/${webtoonId}/${detail.chapters[detail.chapters.length - 1].id}'">
                ▶ Start Reading
              </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="history.back()">← Back</button>
          </div>
        </div>
      </div>

      <div class="chapter-list-header">
        <h2>Chapters</h2>
        <span class="chapter-count">${detail.chapters?.length || 0} chapters</span>
      </div>

      <div class="chapter-list" id="chapter-list">
        ${(detail.chapters || []).map(ch => `
          <div class="chapter-item" onclick="window.location.hash='#/read/${extId}/${webtoonId}/${ch.id}'">
            <span class="chapter-title">${ch.title}</span>
            <span class="chapter-date">${ch.date || ''}</span>
          </div>
        `).join('')}
        ${(!detail.chapters || detail.chapters.length === 0) ? `
          <div class="empty-state">
            <p class="empty-state-text">No chapters available</p>
          </div>
        ` : ''}
      </div>
    `;

        // Library button handler
        let inLibrary = libCheck.inLibrary;
        const libraryBtn = document.getElementById('library-btn');
        libraryBtn?.addEventListener('click', async () => {
            try {
                if (inLibrary) {
                    await libraryApi.remove(webtoonId, extId);
                    inLibrary = false;
                    libraryBtn.className = 'btn btn-primary';
                    libraryBtn.innerHTML = '📚 Add to Library';
                    showToast('Removed from library');
                } else {
                    await libraryApi.add({
                        id: webtoonId,
                        sourceId: extId,
                        title: detail.title,
                        cover: detail.cover,
                        url: detail.url || '',
                    });
                    inLibrary = true;
                    libraryBtn.className = 'btn btn-danger';
                    libraryBtn.innerHTML = '❌ Remove from Library';
                    showToast('Added to library!');
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

    } catch (err) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Failed to load details</p>
        <p class="empty-state-sub">${err.message}</p>
        <br/>
        <button class="btn btn-secondary" onclick="history.back()">← Go Back</button>
      </div>
    `;
    }
}
