import { NextResponse } from 'next/server';
import { GitService } from '@/lib/GitService';
import { CodexService } from '@/lib/CodexService';
import path from 'path';

const PROJECT_ROOT = process.cwd();

export async function POST(request: Request) {
    try {
        console.log('[code-modify] Request received');

        // Validate environment variables first
        const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
        const provider = process.env.GROQ_API_KEY ? 'groq' : 'openai';

        if (!apiKey) {
            console.error('[code-modify] No API key found in environment');
            return NextResponse.json(
                { error: 'Se requiere GROQ_API_KEY o OPENAI_API_KEY en .env.local' },
                { status: 500 }
            );
        }

        console.log(`[code-modify] Using provider: ${provider}`);

        const { prompt, files, autoCommit = true, autoPush = false } = await request.json();
        console.log('[code-modify] Parsed request:', { prompt: prompt.substring(0, 50), autoCommit, autoPush });

        if (!prompt) {
            return NextResponse.json(
                { error: 'Se requiere un prompt' },
                { status: 400 }
            );
        }

        // Initialize services
        console.log('[code-modify] Initializing services...');
        const gitService = new GitService({
            projectPath: PROJECT_ROOT,
            githubToken: process.env.GITHUB_TOKEN,
        });

        const codexService = new CodexService({
            apiKey: apiKey,
            provider: provider as 'openai' | 'groq',
            model: provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
        });
        console.log('[code-modify] Services initialized successfully');

        // Step 1: Analyze the prompt
        const availableFiles = files || await gitService.listFiles();
        const analysis = await codexService.analyzePrompt(prompt, availableFiles);

        if (!analysis.files || analysis.files.length === 0) {
            return NextResponse.json(
                {
                    error: 'No se pudieron identificar archivos para modificar',
                    suggestion: 'Por favor, especifica qué archivos quieres modificar o proporciona más detalles.'
                },
                { status: 400 }
            );
        }

        // Step 2: Create a new branch
        const branchResult = await gitService.createBranch(analysis.intent);

        // Step 3: Modify files
        const modifications = [];
        const filesModified = [];

        for (const file of analysis.files) {
            try {
                // Read current content
                const currentContent = await gitService.readFile(file);

                // Generate modified content using CODEX
                const modification = await codexService.modifyCode(
                    file,
                    currentContent,
                    analysis.changes
                );

                // Validate the modified code
                const validation = await codexService.validateCode(
                    file,
                    modification.modifiedContent
                );

                if (!validation.valid) {
                    console.warn(`Validation warnings for ${file}:`, validation.errors);
                    // Continue anyway, but log warnings
                }

                // Write modified content
                await gitService.writeFile(file, modification.modifiedContent);

                modifications.push(modification);
                filesModified.push(file);
            } catch (error) {
                console.error(`Error modifying ${file}:`, error);
                // Continue with other files
            }
        }

        if (filesModified.length === 0) {
            return NextResponse.json(
                { error: 'No se pudieron modificar archivos' },
                { status: 500 }
            );
        }

        // Step 4: Commit changes (if autoCommit is enabled)
        let commitHash: string | undefined;
        if (autoCommit) {
            const commitMessage = await codexService.generateCommitMessage(modifications);
            const commitResult = await gitService.commit(commitMessage, filesModified);
            commitHash = commitResult.commitHash;
        }

        // Step 5: Push changes (if autoPush is enabled)
        let pushed = false;
        if (autoPush && commitHash) {
            try {
                await gitService.push(branchResult.branchName);
                pushed = true;
            } catch (error) {
                console.error('Failed to push:', error);
                // Don't fail the entire request if push fails
            }
        }

        // Return success response
        return NextResponse.json({
            success: true,
            branch: branchResult.branchName,
            filesModified,
            modifications: modifications.map(m => ({
                file: m.filePath,
                explanation: m.explanation,
            })),
            commitHash,
            pushed,
            analysis: {
                intent: analysis.intent,
                changes: analysis.changes,
            },
        });

    } catch (error: any) {
        console.error('Error in code-modify:', error);

        return NextResponse.json(
            {
                error: 'Error al procesar la solicitud',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
