require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testOpenAI() {
    console.log('Testing OpenAI API...');
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        console.log('\nTesting with gpt-4o-mini...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 10,
        });
        console.log('✅ GPT-4o-mini works!');
        console.log('Response:', completion.choices[0].message.content);
    } catch (error) {
        console.error('❌ Error with gpt-4o-mini:', error.message);

        // Try gpt-3.5-turbo as fallback
        try {
            console.log('\nTrying gpt-3.5-turbo...');
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Say hello' }],
                max_tokens: 10,
            });
            console.log('✅ GPT-3.5-turbo works!');
            console.log('Response:', completion.choices[0].message.content);
        } catch (error2) {
            console.error('❌ Error with gpt-3.5-turbo:', error2.message);
        }
    }
}

testOpenAI();
