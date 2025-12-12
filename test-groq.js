require('dotenv').config({ path: '.env.local' });
const Groq = require('groq-sdk');

async function testGroq() {
    console.log('Testing Groq API...');
    console.log('API Key exists:', !!process.env.GROQ_API_KEY);
    console.log('API Key prefix:', process.env.GROQ_API_KEY?.substring(0, 15) + '...');

    if (!process.env.GROQ_API_KEY) {
        console.error('\n❌ GROQ_API_KEY not found in .env.local');
        console.log('\n📝 Get your free API key at: https://console.groq.com/keys');
        console.log('Then add it to .env.local:');
        console.log('GROQ_API_KEY=your_api_key_here\n');
        return;
    }

    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });

    try {
        console.log('\n✅ Testing with llama-3.3-70b-versatile...');
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say "Hello from Groq!" in JSON format with a key "message"' }],
            temperature: 0.5,
            max_tokens: 50,
            response_format: { type: 'json_object' },
        });

        console.log('✅ Groq is working!');
        console.log('Response:', completion.choices[0].message.content);
        console.log('\n🎉 Your Code Modifier is ready to use with Groq!\n');
    } catch (error) {
        console.error('❌ Error with Groq:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Verify your API key at https://console.groq.com/keys');
        console.log('2. Make sure you copied the full API key');
        console.log('3. Check that GROQ_API_KEY is set in .env.local\n');
    }
}

testGroq();
