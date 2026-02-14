// Radiant Space — SPA Router & App Shell

import { renderLibrary } from './pages/library.js';
import { renderBrowse } from './pages/browse.js'; // Tabbed browse page
import { renderSourcePage } from './pages/source.js'; // Source detail page
import { renderDetail } from './pages/detail.js';
import { renderReader } from './pages/reader.js';
import { renderSettings, applyTheme } from './pages/settings.js';
import { settingsApi } from './api.js';

const content = document.getElementById('content');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

// --- Toast system ---
let toastContainer = document.querySelector('.toast-container');
if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Apply saved theme on load ---
(async () => {
    try {
        const s = await settingsApi.get();
        if (s.theme) applyTheme(s.theme);
    } catch { /* default theme */ }
})();

// --- Mobile sidebar toggle ---
menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
});

overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
});

// --- Router ---
const routes = {
    '/library': { render: renderLibrary, nav: 'library' },
    '/browse': { render: renderBrowse, nav: 'browse' },
    '/settings': { render: renderSettings, nav: 'settings' },
};

function setActiveNav(page) {
    // Update sidebar
    document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    // Update bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach((link) => {
        link.classList.toggle('active', link.dataset.page === page);
    });
}

async function navigate() {
    // Parse hash: #/path?query
    const rawHash = window.location.hash.slice(1) || '/library';
    const [path, query] = rawHash.split('?');

    // Close mobile sidebar
    sidebar.classList.remove('open');
    overlay.classList.remove('active');

    // --- Redirects ---
    if (path === '/extensions') {
        window.location.hash = '#/browse?tab=extensions';
        return;
    }

    // --- Parameterized Routes ---

    // Source Detail: /source/:id
    const sourceMatch = path.match(/^\/source\/(.+)$/);
    if (sourceMatch) {
        setActiveNav('browse'); // Parent nav
        renderPage(renderSourcePage, { id: sourceMatch[1] });
        return;
    }

    // Detail page: /detail/:extId/:webtoonId
    const detailMatch = path.match(/^\/detail\/([^/]+)\/(.+)$/);
    if (detailMatch) {
        setActiveNav('browse'); // Default parent? or check history?
        renderPage(renderDetail, { extId: detailMatch[1], id: detailMatch[2] });
        return;
    }

    // Reader page: /read/:extId/:webtoonId/:chapterId
    const readMatch = path.match(/^\/read\/([^/]+)\/([^/]+)\/(.+)$/);
    if (readMatch) {
        // No active nav for reader usually, or keep previous?
        // setActiveNav(''); 
        await renderReader(content, { extId: readMatch[1], webtoonId: readMatch[2], chapterId: readMatch[3] });
        return;
    }

    // --- Standard Routes ---
    const route = routes[path];
    if (route) {
        setActiveNav(route.nav);
        renderPage(route.render); // Render function might check window.location.hash for params
    } else {
        // Default to library
        window.location.hash = '#/library';
    }
}

async function renderPage(renderFn, params) {
    content.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    content.style.display = ''; // Reset display if reader hid it?
    // Reader might have modified body overflow, reset it?
    document.body.style.overflow = '';

    try {
        await renderFn(content, params);
    } catch (err) {
        console.error(err);
        content.innerHTML = `<div class="error-state">Error: ${err.message}</div>`;
    }
}

window.addEventListener('hashchange', navigate);
window.addEventListener('load', navigate);
