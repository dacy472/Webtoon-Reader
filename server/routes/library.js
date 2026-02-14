import { Router } from 'express';
import { library } from '../store.js';
import { extensionLoader } from '../extension-loader.js';

const router = Router();

// Get all library items
router.get('/', (req, res) => {
    res.json(library.getAll());
});

// Add webtoon to library
router.post('/', (req, res) => {
    const { id, sourceId, title, cover, url } = req.body;
    if (!id || !sourceId || !title) {
        return res.status(400).json({ error: 'id, sourceId, and title are required' });
    }
    const entry = library.add({ id, sourceId, title, cover, url });
    res.json(entry);
});

// Check if in library
router.get('/check', (req, res) => {
    const { id, sourceId } = req.query;
    const entry = library.find(id, sourceId);
    res.json({ inLibrary: !!entry, entry });
});

// Refresh all library items — re-fetch covers/metadata from source extensions
router.post('/refresh', async (req, res) => {
    try {
        const items = library.getAll();
        let updated = 0;

        for (const item of items) {
            const ext = extensionLoader.get(item.sourceId);
            if (!ext) continue; // extension not installed, skip

            try {
                const detail = await ext.getWebtoonDetail(item.id);
                if (detail) {
                    let changed = false;

                    if (detail.cover && detail.cover !== item.cover) {
                        item.cover = detail.cover;
                        changed = true;
                    }
                    if (detail.title && detail.title !== item.title) {
                        item.title = detail.title;
                        changed = true;
                    }

                    if (changed) updated++;
                }
            } catch {
                // individual item refresh failure — skip silently
            }
        }

        // Save all updates at once
        library.writeAll(items);
        res.json({ success: true, total: items.length, updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update reading progress
router.patch('/:id/progress', (req, res) => {
    const { sourceId, chapterId, chapterTitle } = req.body;
    const entry = library.updateProgress(req.params.id, sourceId, chapterId, chapterTitle);
    if (!entry) return res.status(404).json({ error: 'Not in library' });
    res.json(entry);
});

// Remove from library
router.delete('/:id', (req, res) => {
    const { sourceId } = req.query;
    const removed = library.remove(req.params.id, sourceId);
    if (!removed) return res.status(404).json({ error: 'Not in library' });
    res.json({ success: true });
});

export default router;
