// test-news-api.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testNewsAPI() {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
        console.error('❌ ERROR: NEWS_API_KEY is not set in .env.local');
        return;
    }

    console.log('🔑 API Key found, testing NewsAPI...');

    const query = 'Latest stocks and investment indian market news';
    const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=relevancy&apiKey=${apiKey}&pageSize=5`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Failed to fetch news:', response.status, errorData.message);
            return;
        }

        const data = await response.json();
        console.log('\n✅ NewsAPI Response Success!\n');
        console.log('📰 Recent Financial News:');
        data.articles.forEach((article, index) => {
            console.log(`\n${index + 1}. ${article.title}`);
            console.log(`   Source: ${article.source.name}`);
            console.log(`   Description: ${article.description}`);
        });

    } catch (error) {
        console.error('❌ Error testing NewsAPI:', error);
    }
}

testNewsAPI();