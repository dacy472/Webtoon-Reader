// API client for Radiant Space

const BASE = '/api';

async function request(url, options = {}) {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

// Extensions
export const extensions = {
    list: () => request('/extensions'),
    repo: () => request('/extensions/repo'),
    install: (body) => request('/extensions/install', { method: 'POST', body: JSON.stringify(body) }),
    installFromRepo: (repoId) => request('/extensions/install', { method: 'POST', body: JSON.stringify({ repoId }) }),
    remove: (id) => request(`/extensions/${id}`, { method: 'DELETE' }),
    reload: () => request('/extensions/reload', { method: 'POST' }),
};

// Source (browse)
export const source = {
    popular: (extId, page = 1) => request(`/source/${extId}/popular?page=${page}`),
    search: (extId, query, page = 1) => request(`/source/${extId}/search?q=${encodeURIComponent(query)}&page=${page}`),
    detail: (extId, webtoonId) => request(`/source/${extId}/webtoon/${encodeURIComponent(webtoonId)}`),
    chapter: (extId, chapterId) => request(`/source/${extId}/chapter/${encodeURIComponent(chapterId)}`),
};

// Library
export const libraryApi = {
    getAll: () => request('/library'),
    add: (data) => request('/library', { method: 'POST', body: JSON.stringify(data) }),
    check: (id, sourceId) => request(`/library/check?id=${encodeURIComponent(id)}&sourceId=${encodeURIComponent(sourceId)}`),
    updateProgress: (id, sourceId, chapterId, chapterTitle) =>
        request(`/library/${encodeURIComponent(id)}/progress`, {
            method: 'PATCH',
            body: JSON.stringify({ sourceId, chapterId, chapterTitle }),
        }),
    remove: (id, sourceId) => request(`/library/${encodeURIComponent(id)}?sourceId=${encodeURIComponent(sourceId)}`, { method: 'DELETE' }),
    refreshAll: () => request('/library/refresh', { method: 'POST' }),
};

// Settings
export const settingsApi = {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    clearCache: () => request('/settings/cache', { method: 'DELETE' }),
    backup: () => request('/settings/backup'),
    restore: (data) => request('/settings/restore', { method: 'POST', body: JSON.stringify(data) }),
};

// Image proxy helper
export function proxyImageUrl(url, referer = '') {
    return `/api/source/proxy/image?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
}
