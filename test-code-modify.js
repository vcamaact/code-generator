const testCodeModify = async () => {
    try {
        console.log('🧪 Testing Code Modifier with Groq...\n');

        const response = await fetch('http://localhost:3000/api/code-modify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'Add a comment at the very top of src/app/page.tsx that says "// Modified by Groq AI"',
                autoCommit: false,
                autoPush: false,
            }),
        });

        const data = await response.json();

        console.log('Status:', response.status);

        if (response.ok) {
            console.log('\n✅ SUCCESS!');
            console.log('Branch created:', data.branch);
            console.log('Files modified:', data.filesModified);
            console.log('Intent:', data.analysis.intent);
            console.log('\n🎉 Code Modifier is working perfectly with Groq!\n');
        } else {
            console.log('\n❌ Error:', data.error);
            if (data.details) {
                console.log('Details:', data.details);
            }
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
};

testCodeModify();
