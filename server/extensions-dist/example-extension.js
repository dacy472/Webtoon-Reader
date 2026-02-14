/**
 * Radiant Space — Demo Extension
 * ID: demo-source
 * Version: 1.0.0
 */

const EXTENSION_ID = 'demo-source';
const EXTENSION_NAME = 'Demo Source';
const BASE_URL = 'https://example.com';

const MOCK_DATA = [
    {
        id: '1',
        title: 'Solo Leveling (Demo)',
        cover: 'https://via.placeholder.com/300x450/7c5cff/ffffff?text=Solo+Leveling',
        status: 'Ongoing',
        author: 'Chu-Gong',
        artist: 'Dubu',
        description: 'Ten years ago, after "the Gate" that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate.',
        chapters: Array.from({ length: 20 }, (_, i) => ({
            id: `ch-${20 - i}`,
            number: 20 - i,
            title: `Chapter ${20 - i}`,
            date: new Date(Date.now() - i * 86400000).toISOString(),
        })),
    },
    {
        id: '2',
        title: 'Tower of God (Demo)',
        cover: 'https://via.placeholder.com/300x450/ff5ca0/ffffff?text=Tower+of+God',
        status: 'Ongoing',
        author: 'SIU',
        description: 'Reach the top, and everything will be yours. At the top of the tower exists everything in this world, and all of it can be yours.',
        chapters: Array.from({ length: 15 }, (_, i) => ({
            id: `ch-${15 - i}`,
            number: 15 - i,
            title: `Chapter ${15 - i}`,
            date: new Date(Date.now() - i * 86400000).toISOString(),
        })),
    }
];

export default {
    id: EXTENSION_ID,
    name: EXTENSION_NAME,
    icon: '📖',
    version: '1.0.0',
    lang: 'en',
    baseUrl: BASE_URL,

    async search(query, page = 1) {
        // Simple mock search
        const lower = query.toLowerCase();
        const results = MOCK_DATA.filter(m => m.title.toLowerCase().includes(lower));
        return {
            items: results.map(m => ({ id: m.id, title: m.title, cover: m.cover })),
            hasNext: false
        };
    },

    async getPopular(page = 1) {
        return {
            items: MOCK_DATA.map(m => ({ id: m.id, title: m.title, cover: m.cover })),
            hasNext: false
        };
    },

    async getWebtoonDetail(id) {
        const webtoon = MOCK_DATA.find(m => m.id === id);
        if (!webtoon) throw new Error('Webtoon not found');
        return webtoon;
    },

    async getChapterPages(webtoonId, chapterId) {
        // Return 5 mock pages
        return Array.from({ length: 5 }, (_, i) =>
            `https://via.placeholder.com/800x1200/222233/ffffff?text=Page+${i + 1}`
        );
    }
};
