const EXTENSION_ID = 'scan-fr';
const EXTENSION_NAME = 'Scans FR';

const MOCK_DATA = [
    {
        id: 'fr-1',
        title: 'One Piece (FR)',
        cover: 'https://via.placeholder.com/300x450/darkblue/fff?text=One+Piece+FR',
        status: 'Ongoing',
        description: 'Version française de One Piece.',
        chapters: Array.from({ length: 10 }, (_, i) => ({
            id: `ch-${1000 - i}`,
            number: 1000 - i,
            title: `Chapitre ${1000 - i}`,
            date: new Date().toISOString()
        }))
    }
];

export default {
    id: EXTENSION_ID,
    name: EXTENSION_NAME,
    icon: '🇫🇷',
    version: '1.0.0',
    lang: 'fr',
    baseUrl: 'https://example.com/fr',

    async search(query) {
        return { webtoons: MOCK_DATA, hasNext: false };
    },

    async getPopular() {
        return { webtoons: MOCK_DATA, hasNext: false };
    },

    async getWebtoonDetail(id) {
        return MOCK_DATA.find(m => m.id === id);
    },

    async getChapterPages() {
        return Array.from({ length: 4 }, (_, i) => `https://via.placeholder.com/800x1200/fff/000?text=Page+FR+${i + 1}`);
    }
};
