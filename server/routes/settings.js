import { Router } from 'express';
import { settings, library } from '../store.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Get current settings
router.get('/', (req, res) => {
    res.json(settings.get());
});

// Update settings (partial merge)
router.patch('/', (req, res) => {
    const updated = settings.update(req.body);
    res.json(updated);
});

// Export library backup as JSON
router.get('/backup', (req, res) => {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        library: library.getAll(),
        settings: settings.get(),
    };
    res.setHeader('Content-Disposition', `attachment; filename="radiant-space-backup-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
});

// Restore library from backup JSON
router.post('/restore', (req, res) => {
    try {
        const { library: libData, settings: settingsData } = req.body;

        if (!libData || !Array.isArray(libData)) {
            return res.status(400).json({ error: 'Invalid backup: missing library array' });
        }

        library.writeAll(libData);

        if (settingsData && typeof settingsData === 'object') {
            settings.update(settingsData);
        }

        res.json({ success: true, restored: libData.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear chapter cache / temp data
router.delete('/cache', (req, res) => {
    const dataDir = path.join(__dirname, '..', '..', 'data');
    let cleared = 0;

    // Remove cache files (anything except library.json and settings.json)
    if (fs.existsSync(dataDir)) {
        const keep = new Set(['library.json', 'settings.json']);
        const files = fs.readdirSync(dataDir);
        for (const file of files) {
            if (!keep.has(file)) {
                try {
                    fs.unlinkSync(path.join(dataDir, file));
                    cleared++;
                } catch { /* skip */ }
            }
        }
    }

    res.json({ success: true, filesCleared: cleared });
});

export default router;
