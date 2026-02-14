import { Router } from 'express';
import { extensionLoader } from '../extension-loader.js';
import { settings } from '../store.js';
import config from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// List installed extensions
router.get('/', (req, res) => {
    res.json(extensionLoader.getAll());
});

// Helper: get the effective repo URL (settings only, no config fallback)
function getRepoUrl() {
    const s = settings.get();
    return s.repoUrl;
}

// Serve local extensions statically (acting as a built-in remote repo)
// Access via: http://localhost:3001/api/extensions/repo/static/repo.json
router.get('/repo/static/:file', (req, res) => {
    const file = req.params.file;
    // This directory contains the "source" files for distribution
    const distDir = path.join(__dirname, '..', 'extensions-dist');
    const filePath = path.join(distDir, file);

    // prevent directory traversal
    if (!filePath.startsWith(distDir)) return res.status(403).send('Forbidden');

    if (fs.existsSync(filePath)) {
        if (file.endsWith('.json')) res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
        else res.sendFile(filePath);
    } else {
        res.status(404).send('Not found');
    }
});

// Helper: normalize Keiyoushi/Tachiyomi format to our format
function normalizeTachiyomiRepo(data) {
    const extensions = data.map(entry => {
        // Each entry has name, pkg, apk, lang, version, nsfw, sources[]
        const firstSource = entry.sources?.[0] || {};
        return {
            id: entry.pkg || firstSource.id || entry.name,
            name: entry.name?.replace(/^Tachiyomi:\s*/, '') || firstSource.name || 'Unknown',
            icon: '📱',
            lang: entry.lang || firstSource.lang || 'all',
            version: entry.version || '1.0.0',
            description: `${firstSource.baseUrl || ''} — ${entry.sources?.length || 0} source(s)`,
            nsfw: entry.nsfw === 1,
            sourceCount: entry.sources?.length || 0,
            baseUrl: firstSource.baseUrl || '',
            format: 'tachiyomi', // flag: cannot be installed in our app
            installed: false,
        };
    });

    return {
        name: 'Keiyoushi Extensions (Tachiyomi)',
        description: `${extensions.length} extensions from the Keiyoushi/Tachiyomi repository. These are Android APK extensions and are shown for reference only.`,
        extensions,
    };
}

// Fetch available extensions from the repo manifest
router.get('/repo', async (req, res) => {
    try {
        const installed = extensionLoader.getAll();
        const installedIds = new Set(installed.map(e => e.id));

        const repoUrl = getRepoUrl();

        // STRICT: If no repo URL is set, return empty list
        if (!repoUrl) {
            return res.json({
                name: 'No Repository Configured',
                description: 'Please configure an extension repository URL in Settings.',
                extensions: []
            });
        }

        let repoData;

        try {
            const response = await fetch(repoUrl, { timeout: 8000 });
            if (response.ok) {
                const raw = await response.json();

                // Auto-detect format: array = Tachiyomi, object with .extensions = our format
                if (Array.isArray(raw)) {
                    repoData = normalizeTachiyomiRepo(raw);
                } else {
                    repoData = raw;
                }
            }
        } catch (err) {
            return res.status(502).json({ error: `Failed to fetch repository: ${err.message}` });
        }

        if (!repoData) {
            return res.json({ extensions: [] });
        }

        // Annotate each extension with install status
        const available = (repoData.extensions || []).map(ext => ({
            ...ext,
            installed: ext.format === 'tachiyomi' ? false : installedIds.has(ext.id),
        }));

        res.json({
            name: repoData.name || 'Extension Repository',
            description: repoData.description || '',
            extensions: available,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Install extension from URL or from repo
router.post('/install', async (req, res) => {
    try {
        const { url, code, repoId } = req.body;
        const extDir = path.join(__dirname, '..', '..', 'extensions');

        // Install from repo by ID
        if (repoId) {
            const repoUrl = getRepoUrl();
            if (!repoUrl) return res.status(400).json({ error: 'No repository URL configured' });

            // Load repo manifest to find the extension filename
            let repoData;
            try {
                const response = await fetch(repoUrl, { timeout: 5000 });
                if (response.ok) {
                    const raw = await response.json();
                    repoData = Array.isArray(raw) ? null : raw; // Only our format supports install
                }
            } catch { /* ignore */ }

            if (!repoData) return res.status(500).json({ error: 'Could not load repository manifest' });

            const repoExt = repoData.extensions.find(e => e.id === repoId);
            if (!repoExt) return res.status(404).json({ error: `Extension "${repoId}" not found in repository` });

            // Determine download URL
            let downloadUrl;
            const filename = repoExt.filename;

            if (filename.startsWith('http://') || filename.startsWith('https://')) {
                downloadUrl = filename;
            } else {
                // Resolve relative to repoUrl
                // If repoUrl is '.../repo.json', base is '.../'
                // If repoUrl is '.../index.json', base is '.../'
                const baseUrl = repoUrl.substring(0, repoUrl.lastIndexOf('/') + 1);
                downloadUrl = new URL(filename, baseUrl).href;
            }

            console.log(`Downloading extension from: ${downloadUrl}`);

            let content;
            try {
                const response = await fetch(downloadUrl, { timeout: 10000 });
                if (response.ok) content = await response.text();
                else throw new Error(`Status ${response.status}`);
            } catch (err) {
                return res.status(502).json({ error: `Failed to download extension file: ${err.message}` });
            }

            const saveFilename = path.basename(filename) || `ext-${repoId}.js`;
            fs.writeFileSync(path.join(extDir, saveFilename), content, 'utf-8');

            const ext = await extensionLoader.loadExtension(saveFilename);
            if (!ext) return res.status(400).json({ error: 'Invalid extension file' });

            return res.json({ success: true, extension: { id: ext.id, name: ext.name } });
        }

        // Install from direct URL
        if (url) {
            const response = await fetch(url);
            const content = await response.text();
            const filename = path.basename(new URL(url).pathname) || `ext-${Date.now()}.js`;
            fs.writeFileSync(path.join(extDir, filename), content, 'utf-8');
            const ext = await extensionLoader.loadExtension(filename);
            if (!ext) return res.status(400).json({ error: 'Invalid extension file' });
            return res.json({ success: true, extension: { id: ext.id, name: ext.name } });
        }

        // Install from raw code
        if (code) {
            const filename = `ext-${Date.now()}.js`;
            fs.writeFileSync(path.join(extDir, filename), code, 'utf-8');
            const ext = await extensionLoader.loadExtension(filename);
            if (!ext) return res.status(400).json({ error: 'Invalid extension code' });
            return res.json({ success: true, extension: { id: ext.id, name: ext.name } });
        }

        res.status(400).json({ error: 'Provide url, code, or repoId' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove extension
router.delete('/:id', async (req, res) => {
    const removed = await extensionLoader.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Extension not found' });
    res.json({ success: true });
});

// Reload all extensions
router.post('/reload', async (req, res) => {
    await extensionLoader.loadAll();
    res.json({ success: true, count: extensionLoader.getAll().length });
});

export default router;
