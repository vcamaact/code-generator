// Test script to verify multi-repository support
const testExternalRepo = async () => {
    try {
        console.log('🧪 Testing Multi-Repository Support...\n');

        // Test 1: Clone external repo and modify
        console.log('Test 1: Modificar repositorio externo');
        const response = await fetch('http://localhost:3000/api/code-modify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repoUrl: 'https://github.com/lucho-accounttech/code-generator.git',
                targetBranch: 'master',
                prompt: 'Add a comment at the top of README.md that says "// Modified via Code Modifier AI"',
                autoCommit: true,
                autoPush: true,
                autoCleanup: true,
            }),
        });

        const data = await response.json();

        console.log('Status:', response.status);

        if (response.ok) {
            console.log('\n✅ SUCCESS!');
            console.log('Repositorio:', data.repoUrl);
            console.log('Es repo externo:', data.isExternalRepo);
            console.log('Branch creada:', data.branch);
            console.log('Files modified:', data.filesModified);
            console.log('Pushed:', data.pushed);
            console.log('\n🎉  Multi-Repository Support está funcionando perfectamente!\n');
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

testExternalRepo();
