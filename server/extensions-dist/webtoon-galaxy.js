const EXTENSION_ID = 'webtoon-galaxy';
const EXTENSION_NAME = 'Webtoon Galaxy';

const MOCK_DATA = [
    {
        id: 'wg-1',
        title: 'Omniscient Reader (Galaxy)',
        cover: 'https://via.placeholder.com/300x450/222/fff?text=ORV',
        status: 'Ongoing',
        description: 'Mock data for Webtoon Galaxy source.',
        chapters: Array.from({ length: 10 }, (_, i) => ({
            id: `ch-${10 - i}`,
            number: 10 - i,
            title: `Episode ${10 - i}`,
            date: new Date().toISOString()
        }))
    },
    {
        id: 'wg-2',
        title: 'The Boxer (Galaxy)',
        cover: 'https://via.placeholder.com/300x450/444/fff?text=Boxer',
        status: 'Completed',
        description: 'Mock data for Webtoon Galaxy source.',
        chapters: Array.from({ length: 5 }, (_, i) => ({
            id: `ch-${5 - i}`,
            number: 5 - i,
            title: `Round ${5 - i}`,
            date: new Date().toISOString()
        }))
    }
];

export default {
    id: EXTENSION_ID,
    name: EXTENSION_NAME,
    icon: '🌌',
    version: '1.0.0',
    lang: 'en',
    baseUrl: 'https://example.com/galaxy',

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
        return Array.from({ length: 3 }, (_, i) => `https://via.placeholder.com/800x1200/111/fff?text=Galaxy+Page+${i + 1}`);
    }
};
