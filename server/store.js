import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(name) {
    return path.join(DATA_DIR, `${name}.json`);
}

function read(name) {
    const fp = getFilePath(name);
    if (!fs.existsSync(fp)) return [];
    try {
        return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch {
        return [];
    }
}

function write(name, data) {
    fs.writeFileSync(getFilePath(name), JSON.stringify(data, null, 2), 'utf-8');
}

// Library operations
export const library = {
    getAll() {
        return read('library');
    },

    add(webtoon) {
        const lib = read('library');
        const exists = lib.find(w => w.id === webtoon.id && w.sourceId === webtoon.sourceId);
        if (exists) return exists;
        const entry = {
            ...webtoon,
            addedAt: Date.now(),
            lastRead: null,
            lastChapterId: null,
            lastChapterTitle: null,
        };
        lib.push(entry);
        write('library', lib);
        return entry;
    },

    remove(id, sourceId) {
        let lib = read('library');
        const len = lib.length;
        lib = lib.filter(w => !(w.id === id && w.sourceId === sourceId));
        if (lib.length === len) return false;
        write('library', lib);
        return true;
    },

    updateProgress(id, sourceId, chapterId, chapterTitle) {
        const lib = read('library');
        const entry = lib.find(w => w.id === id && w.sourceId === sourceId);
        if (!entry) return null;
        entry.lastRead = Date.now();
        entry.lastChapterId = chapterId;
        entry.lastChapterTitle = chapterTitle;
        write('library', lib);
        return entry;
    },

    find(id, sourceId) {
        const lib = read('library');
        return lib.find(w => w.id === id && w.sourceId === sourceId) || null;
    },

    writeAll(items) {
        write('library', items);
    },
};

// Settings operations
const DEFAULT_SETTINGS = {
    theme: 'dark',
    repoUrl: '',
};

export const settings = {
    get() {
        const fp = getFilePath('settings');
        if (!fs.existsSync(fp)) return { ...DEFAULT_SETTINGS };
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(fp, 'utf-8')) };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    },

    update(partial) {
        const current = settings.get();
        const merged = { ...current, ...partial };
        fs.writeFileSync(getFilePath('settings'), JSON.stringify(merged, null, 2), 'utf-8');
        return merged;
    },
};
