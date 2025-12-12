// Test script to verify code-modify API
const testApiEndpoint = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/code-modify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'Add a comment at the top of page.tsx that says "Test comment"',
                autoCommit: false,
                autoPush: false,
            }),
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
};

testApiEndpoint();
