const BASE_URL = 'https://api.mangadex.org';
const COVER_BASE_URL = 'https://uploads.mangadex.org/covers';

// Helper to handle API requests
async function fetchApi(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
}

export default {
    id: 'mangadex',
    name: 'MangaDex',
    icon: '🍱',
    version: '1.0.0',
    lang: 'all',
    baseUrl: 'https://mangadex.org',

    async search(query, page = 1) {
        const limit = 20;
        const offset = (page - 1) * limit;
        const url = `/manga?limit=${limit}&offset=${offset}&title=${encodeURIComponent(query)}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&order[relevance]=desc`;

        const data = await fetchApi(url);

        const items = data.data.map(m => {
            const title = Object.values(m.attributes.title)[0] || 'Unknown Title';
            const coverRel = m.relationships.find(r => r.type === 'cover_art');
            const coverFile = coverRel?.attributes?.fileName;
            const cover = coverFile ? `${COVER_BASE_URL}/${m.id}/${coverFile}.256.jpg` : null;

            return {
                id: m.id,
                title,
                cover
            };
        });

        return {
            webtoons: items,
            hasNext: offset + limit < data.total
        };
    },

    async getPopular(page = 1) {
        const limit = 20;
        const offset = (page - 1) * limit;
        // Search sorted by follower count (popular)
        const url = `/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;

        const data = await fetchApi(url);

        const items = data.data.map(m => {
            const title = Object.values(m.attributes.title)[0] || 'Unknown Title';
            const coverRel = m.relationships.find(r => r.type === 'cover_art');
            const coverFile = coverRel?.attributes?.fileName;
            const cover = coverFile ? `${COVER_BASE_URL}/${m.id}/${coverFile}.256.jpg` : null;

            return {
                id: m.id,
                title,
                cover
            };
        });

        return {
            webtoons: items,
            hasNext: offset + limit < data.total
        };
    },

    async getWebtoonDetail(id) {
        const data = await fetchApi(`/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
        const m = data.data;

        const title = Object.values(m.attributes.title)[0] || 'Unknown Title';
        const description = m.attributes.description ? (Object.values(m.attributes.description)[0] || '') : '';
        const status = m.attributes.status;

        const authorRel = m.relationships.find(r => r.type === 'author');
        const artistRel = m.relationships.find(r => r.type === 'artist');
        const coverRel = m.relationships.find(r => r.type === 'cover_art');

        const coverFile = coverRel?.attributes?.fileName;
        const cover = coverFile ? `${COVER_BASE_URL}/${m.id}/${coverFile}` : null;

        // Fetch chapters (simplified: English only, sorted by chapter number descending)
        const chaptersLimit = 100;
        const feedUrl = `/manga/${id}/feed?limit=${chaptersLimit}&translatedLanguage[]=en&order[chapter]=desc&includeFutureUpdates=0`;
        const feedData = await fetchApi(feedUrl);

        const chapters = feedData.data.map(ch => ({
            id: ch.id,
            number: ch.attributes.chapter || '0',
            title: ch.attributes.title ? `Ch. ${ch.attributes.chapter} - ${ch.attributes.title}` : `Chapter ${ch.attributes.chapter}`,
            date: ch.attributes.publishAt
        }));

        return {
            id: m.id,
            title,
            cover,
            description,
            status: status.charAt(0).toUpperCase() + status.slice(1),
            author: authorRel?.attributes?.name || 'Unknown',
            artist: artistRel?.attributes?.name || 'Unknown',
            chapters
        };
    },

    async getChapterPages(webtoonId, chapterId) {
        const atHome = await fetchApi(`/at-home/server/${chapterId}`);
        const baseUrl = atHome.baseUrl;
        const hash = atHome.chapter.hash;
        const filenames = atHome.chapter.data; // High quality
        // const filenames = atHome.chapter.dataSaver; // Low quality

        return filenames.map(file => `${baseUrl}/data/${hash}/${file}`);
    }
};
