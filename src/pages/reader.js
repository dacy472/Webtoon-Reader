// Reader Page — Vertical infinite scroll webtoon reader

import { source, libraryApi, proxyImageUrl } from '../api.js';
import { showToast } from '../main.js';

export async function renderReader(container, extId, webtoonId, chapterId) {
    const contentArea = document.getElementById('content');
    const sidebar = document.getElementById('sidebar');

    // Hide sidebar and main content area during reading
    contentArea.style.display = 'none';

    // Get chapter list for nav
    let detail;
    try {
        detail = await source.detail(extId, webtoonId);
    } catch {
        detail = { chapters: [], title: 'Unknown' };
    }

    const chapters = detail.chapters || [];
    const currentIdx = chapters.findIndex(ch => ch.id === chapterId);
    const currentChapter = chapters[currentIdx];
    const prevChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;
    const nextChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;

    // Build reader DOM
    const readerEl = document.createElement('div');
    readerEl.className = 'reader-container';
    readerEl.id = 'reader-root';
    readerEl.innerHTML = `
    <div class="reader-header" id="reader-header">
      <button class="btn btn-sm btn-secondary" id="reader-close">✕ Close</button>
      <div class="reader-title">${detail.title} — ${currentChapter?.title || chapterId}</div>
      <select id="chapter-select" class="select-field" style="width:160px; padding:6px 28px 6px 10px; font-size:0.82rem;">
        ${chapters.map(ch => `<option value="${ch.id}" ${ch.id === chapterId ? 'selected' : ''}>${ch.title}</option>`).join('')}
      </select>
    </div>

    <div class="reader-body" id="reader-body">
      <div class="loader"><div class="spinner"></div></div>
    </div>

    <div class="reader-footer" id="reader-footer">
      <button class="btn btn-secondary btn-sm" id="prev-ch" ${!prevChapter ? 'disabled style="opacity:0.3"' : ''}>
        ← Previous
      </button>
      <span style="font-size:0.82rem; color:var(--text-muted);">
        ${currentChapter?.title || ''}
      </span>
      <button class="btn btn-secondary btn-sm" id="next-ch" ${!nextChapter ? 'disabled style="opacity:0.3"' : ''}>
        Next →
      </button>
    </div>
  `;

    document.body.appendChild(readerEl);

    // Load chapter pages
    try {
        const pages = await source.chapter(extId, chapterId);
        const body = document.getElementById('reader-body');
        body.innerHTML = '';

        pages.forEach((page, idx) => {
            const img = document.createElement('img');
            img.src = proxyImageUrl(page.url, page.referer || '');
            img.alt = `Page ${idx + 1}`;
            img.loading = idx < 3 ? 'eager' : 'lazy';
            body.appendChild(img);
        });

        // Save progress
        try {
            await libraryApi.updateProgress(webtoonId, extId, chapterId, currentChapter?.title || chapterId);
        } catch { /* not in library, that's fine */ }

    } catch (err) {
        document.getElementById('reader-body').innerHTML = `
      <div class="empty-state" style="padding-top:120px">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Failed to load chapter</p>
        <p class="empty-state-sub">${err.message}</p>
      </div>
    `;
    }

    // --- Event handlers ---

    // Close reader
    document.getElementById('reader-close')?.addEventListener('click', () => {
        closeReader(contentArea, readerEl);
        window.location.hash = `#/detail/${extId}/${webtoonId}`;
    });

    // Chapter select
    document.getElementById('chapter-select')?.addEventListener('change', (e) => {
        closeReader(contentArea, readerEl);
        window.location.hash = `#/read/${extId}/${webtoonId}/${e.target.value}`;
    });

    // Prev/Next
    document.getElementById('prev-ch')?.addEventListener('click', () => {
        if (prevChapter) {
            closeReader(contentArea, readerEl);
            window.location.hash = `#/read/${extId}/${webtoonId}/${prevChapter.id}`;
        }
    });

    document.getElementById('next-ch')?.addEventListener('click', () => {
        if (nextChapter) {
            closeReader(contentArea, readerEl);
            window.location.hash = `#/read/${extId}/${webtoonId}/${nextChapter.id}`;
        }
    });

    // Toggle header/footer on click
    const body = document.getElementById('reader-body');
    body?.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            document.getElementById('reader-header')?.classList.toggle('hidden');
            document.getElementById('reader-footer')?.classList.toggle('hidden');
        }
    });

    // Keyboard shortcuts
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            closeReader(contentArea, readerEl);
            window.location.hash = `#/detail/${extId}/${webtoonId}`;
            document.removeEventListener('keydown', keyHandler);
        }
        if (e.key === 'ArrowLeft' && prevChapter) {
            closeReader(contentArea, readerEl);
            window.location.hash = `#/read/${extId}/${webtoonId}/${prevChapter.id}`;
            document.removeEventListener('keydown', keyHandler);
        }
        if (e.key === 'ArrowRight' && nextChapter) {
            closeReader(contentArea, readerEl);
            window.location.hash = `#/read/${extId}/${webtoonId}/${nextChapter.id}`;
            document.removeEventListener('keydown', keyHandler);
        }
    };
    document.addEventListener('keydown', keyHandler);
}

function closeReader(contentArea, readerEl) {
    contentArea.style.display = '';
    readerEl?.remove();
}
