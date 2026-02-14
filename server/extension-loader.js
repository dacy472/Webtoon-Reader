import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');

const REQUIRED_FIELDS = ['id', 'name', 'baseUrl'];
const REQUIRED_METHODS = ['getPopular', 'search', 'getWebtoonDetail', 'getChapterPages'];

class ExtensionLoader {
    constructor() {
        this.extensions = new Map();
    }

    validate(ext, filename) {
        for (const field of REQUIRED_FIELDS) {
            if (!ext[field]) {
                console.warn(`⚠ Extension ${filename} missing required field: ${field}`);
                return false;
            }
        }
        for (const method of REQUIRED_METHODS) {
            if (typeof ext[method] !== 'function') {
                console.warn(`⚠ Extension ${filename} missing required method: ${method}()`);
                return false;
            }
        }
        return true;
    }

    async loadAll() {
        if (!fs.existsSync(EXTENSIONS_DIR)) {
            fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
        }

        const files = fs.readdirSync(EXTENSIONS_DIR).filter(f => f.endsWith('.js'));
        console.log(`📦 Loading ${files.length} extension(s)...`);

        for (const file of files) {
            await this.loadExtension(file);
        }
    }

    async loadExtension(filename) {
        try {
            const filePath = path.join(EXTENSIONS_DIR, filename);
            const fileUrl = pathToFileURL(filePath).href;
            // Cache-bust for hot reloading
            const mod = await import(`${fileUrl}?t=${Date.now()}`);
            const ext = mod.default || mod;

            if (!this.validate(ext, filename)) return null;

            this.extensions.set(ext.id, { ...ext, _filename: filename });
            console.log(`  ✅ ${ext.name} (${ext.id})`);
            return ext;
        } catch (err) {
            console.error(`  ❌ Failed to load ${filename}:`, err.message);
            return null;
        }
    }

    get(id) {
        return this.extensions.get(id);
    }

    getAll() {
        return Array.from(this.extensions.values()).map(ext => ({
            id: ext.id,
            name: ext.name,
            baseUrl: ext.baseUrl,
            lang: ext.lang || 'en',
            icon: ext.icon || '🌐',
            _filename: ext._filename,
        }));
    }

    async remove(id) {
        const ext = this.extensions.get(id);
        if (!ext) return false;
        const filePath = path.join(EXTENSIONS_DIR, ext._filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        this.extensions.delete(id);
        return true;
    }
}

export const extensionLoader = new ExtensionLoader();
