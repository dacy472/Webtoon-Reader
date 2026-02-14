import { Router } from 'express';
import { extensionLoader } from '../extension-loader.js';
import fetch from 'node-fetch';

const router = Router();

// Image proxy — bypasses hotlink protection / CORS
router.get('/proxy/image', async (req, res) => {
    try {
        const { url, referer } = req.query;
        if (!url) return res.status(400).json({ error: 'url param required' });

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        if (referer) headers['Referer'] = referer;

        const response = await fetch(url, { headers });
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get popular webtoons from a source
router.get('/:extId/popular', async (req, res) => {
    try {
        const ext = extensionLoader.get(req.params.extId);
        if (!ext) return res.status(404).json({ error: 'Extension not found' });
        const page = parseInt(req.query.page) || 1;
        const results = await ext.getPopular(page);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search webtoons
router.get('/:extId/search', async (req, res) => {
    try {
        const ext = extensionLoader.get(req.params.extId);
        if (!ext) return res.status(404).json({ error: 'Extension not found' });
        const { q, page } = req.query;
        const results = await ext.search(q || '', parseInt(page) || 1);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get webtoon detail + chapters
router.get('/:extId/webtoon/:webtoonId', async (req, res) => {
    try {
        const ext = extensionLoader.get(req.params.extId);
        if (!ext) return res.status(404).json({ error: `Extension not found: '${req.params.extId}'` });
        const detail = await ext.getWebtoonDetail(req.params.webtoonId);
        res.json(detail);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get chapter pages (image URLs)
router.get('/:extId/chapter/:chapterId', async (req, res) => {
    try {
        const ext = extensionLoader.get(req.params.extId);
        if (!ext) return res.status(404).json({ error: 'Extension not found' });
        const pages = await ext.getChapterPages(req.params.chapterId);
        res.json(pages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
