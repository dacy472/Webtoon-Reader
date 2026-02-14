import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionLoader } from './extension-loader.js';
import extensionsRouter from './routes/extensions.js';
import sourceRouter from './routes/source.js';
import libraryRouter from './routes/library.js';
import settingsRouter from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Load extensions on startup
await extensionLoader.loadAll();

// API routes
app.use('/api/extensions', extensionsRouter);
app.use('/api/source', sourceRouter);
app.use('/api/library', libraryRouter);
app.use('/api/settings', settingsRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Radiant Space server running on http://localhost:${PORT}`);
});
