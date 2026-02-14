// import fetch from 'node-fetch'; // Using global fetch

async function test() {
    const baseUrl = 'http://localhost:3001/api';
    const extId = 'mangadex';

    console.log(`Testing extension: ${extId}`);

    // 1. Popular
    try {
        console.log('Fetching popular...');
        const popRes = await fetch(`${baseUrl}/source/${extId}/popular?page=1`);
        if (!popRes.ok) throw new Error(`Popular failed: ${popRes.status} ${await popRes.text()}`);
        const popData = await popRes.json();
        const items = popData.webtoons || popData.items; // Check both in case patching failed or cached
        console.log(`Popular OK. Items: ${items?.length}`);

        if (!items || items.length === 0) {
            console.error('No webtoons found to test detail.');
            return;
        }

        const firstId = items[0].id;
        console.log(`Testing details for ID: ${firstId}`);

        // 2. Detail
        const detRes = await fetch(`${baseUrl}/source/${extId}/webtoon/${firstId}`);
        if (!detRes.ok) {
            console.error(`Detail failed STATUS: ${detRes.status}`);
            console.error(`Response: ${await detRes.text()}`);
        } else {
            const detData = await detRes.json();
            console.log(`Detail OK. Title: ${detData.title}`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
