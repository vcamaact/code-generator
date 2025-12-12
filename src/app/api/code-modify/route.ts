import { NextResponse } from 'next/server';
import { GitService } from '@/lib/GitService';
import { CodexService } from '@/lib/CodexService';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const TEMP_REPOS_DIR = path.join(PROJECT_ROOT, '.temp-repos');

export async function POST(request: Request) {
    const encoder = new TextEncoder();

    // Create a streaming response
    const stream = new ReadableStream({
        async start(controller) {
            // Helper to send JSON messages
            const send = (data: any) => {
                try {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                } catch (e) {
                    // Controller might be closed
                }
            };

            let clonedRepoPath: string | null = null;
            let gitService: GitService | null = null;

            try {
                send({ type: 'log', message: 'Request received' });

                // Validate environment variables first
                const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
                const provider = process.env.GROQ_API_KEY ? 'groq' : 'openai';

                if (!apiKey) {
                    send({ type: 'error', error: 'Se requiere GROQ_API_KEY o OPENAI_API_KEY en .env.local' });
                    return;
                }

                send({ type: 'log', message: `Using provider: ${provider}` });

                const {
                    prompt,
                    commitTitle,
                    files,
                    repoUrl,
                    targetBranch = 'main',
                    autoCommit = true,
                    autoPush = false,
                    autoCleanup = true,
                    autoMerge = false
                } = await request.json();

                if (!prompt) {
                    send({ type: 'error', error: 'Se requiere un prompt' });
                    return;
                }

                // Determine working directory
                let workingPath = PROJECT_ROOT;
                let isExternalRepo = false;

                // Handle external repository
                if (repoUrl) {
                    isExternalRepo = true;
                    const repoInfo = GitService.parseRepoUrl(repoUrl);

                    if (!repoInfo) {
                        send({ type: 'error', error: 'URL de repositorio inválida. Use formato: https://github.com/owner/repo.git' });
                        return;
                    }

                    // Create unique temp directory for this repo
                    const timestamp = Date.now();
                    clonedRepoPath = path.join(TEMP_REPOS_DIR, `${repoInfo.owner}-${repoInfo.repo}-${timestamp}`);
                    workingPath = clonedRepoPath;

                    send({ type: 'log', message: 'Cloning external repository...' });
                    send({ type: 'progress', stage: 'cloning', message: 'Iniciando clonación...', percent: 0 });

                    // Use GitService static method for cloning
                    const { promises: fs } = await import('fs');
                    const simpleGit = (await import('simple-git')).default;

                    // Ensure temp directory exists
                    await fs.mkdir(TEMP_REPOS_DIR, { recursive: true });

                    // Inject GitHub token into URL for authentication
                    let authenticatedUrl = repoUrl;
                    if (process.env.GITHUB_TOKEN && repoUrl.includes('github.com')) {
                        authenticatedUrl = repoUrl.replace(
                            'https://github.com/',
                            `https://${process.env.GITHUB_TOKEN}@github.com/`
                        );
                    }

                    // Clone repository
                    const git = simpleGit({
                        progress({ method, stage, progress }) {
                            // Send cloning progress
                            send({
                                type: 'progress',
                                stage: 'cloning',
                                message: `Clonando: ${stage} ${progress}%`,
                                percent: progress
                            });
                        }
                    });

                    await git.clone(authenticatedUrl, clonedRepoPath, {
                        '--depth': 1,  // Shallow clone for speed
                        '--progress': null,
                    });

                    send({ type: 'log', message: 'Repository cloned successfully' });
                    send({ type: 'progress', stage: 'cloning', message: 'Clonación completada', percent: 100 });

                    // Configure git to not use credential helper for this repo
                    const clonedGit = simpleGit(clonedRepoPath);
                    await clonedGit.addConfig('credential.helper', '', false, 'local');
                    await clonedGit.addConfig('core.askpass', '', false, 'local');
                    await clonedGit.addConfig('credential.useHttpPath', 'true', false, 'local');

                    send({ type: 'log', message: 'Disabled credential helper for cloned repo' });
                }

                // Initialize services with working path
                send({ type: 'log', message: 'Initializing services...' });

                gitService = new GitService({
                    projectPath: workingPath,
                    githubToken: process.env.GITHUB_TOKEN,
                });

                const codexService = new CodexService({
                    apiKey: apiKey,
                    provider: provider as 'openai' | 'groq',
                    model: provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
                });

                // If external repo, checkout target branch
                if (isExternalRepo && targetBranch) {
                    try {
                        send({ type: 'progress', stage: 'setup', message: `Checkout a branch ${targetBranch}` });
                        await gitService.checkoutBranch(targetBranch);
                    } catch (error) {
                        send({ type: 'log', message: `Could not checkout ${targetBranch}, using default branch` });
                    }
                }

                // Step 1: Analyze the prompt
                send({ type: 'progress', stage: 'analyzing', message: 'Analizando prompt e identificando archivos...' });

                const availableFiles = files || await gitService.listFiles();
                const analysis = await codexService.analyzePrompt(prompt, availableFiles);

                if (!analysis.files || analysis.files.length === 0) {
                    send({
                        type: 'error',
                        error: 'No se pudieron identificar archivos para modificar',
                        suggestion: 'Por favor, especifica qué archivos quieres modificar.'
                    });
                    return;
                }

                // Step 2: Create a new branch
                send({ type: 'progress', stage: 'branching', message: 'Creando nueva rama...' });

                // Use commit title for branch name if provided, otherwise use analysis intent
                const branchDescription = commitTitle || analysis.intent;
                const branchResult = await gitService!.createBranch(branchDescription);

                // Step 3: Modify files
                send({ type: 'progress', stage: 'modifying', message: `Modificando ${analysis.files.length} archivos...` });

                const modifications = [];
                const filesModified = [];

                for (let i = 0; i < analysis.files.length; i++) {
                    const file = analysis.files[i];
                    try {
                        const percent = Math.round(((i + 1) / analysis.files.length) * 100);
                        send({
                            type: 'progress',
                            stage: 'modifying',
                            message: `Modificando ${file}...`,
                            percent
                        });

                        // Read current content
                        const currentContent = await gitService!.readFile(file);

                        // Generate modified content using CODEX
                        const modification = await codexService.modifyCode(
                            file,
                            currentContent,
                            analysis.changes
                        );

                        // Write modified content
                        await gitService!.writeFile(file, modification.modifiedContent);

                        modifications.push(modification);
                        filesModified.push(file);
                    } catch (error) {
                        console.error(`Error modifying ${file}:`, error);
                    }
                }

                if (filesModified.length === 0) {
                    send({ type: 'error', error: 'No se pudieron modificar archivos' });
                    return;
                }

                // Step 4: Commit changes
                let commitHash: string | undefined;
                if (autoCommit) {
                    send({ type: 'progress', stage: 'committing', message: 'Creando commit...' });

                    const commitMessage = commitTitle || await codexService.generateCommitMessage(modifications);
                    const commitResult = await gitService!.commit(commitMessage, filesModified);
                    commitHash = commitResult.commitHash;
                }

                // Step 5: Push changes
                let pushed = false;
                let merged = false;

                if (autoPush && commitHash) {
                    try {
                        send({ type: 'progress', stage: 'pushing', message: 'Subiendo cambios a GitHub...' });

                        // Push feature branch
                        await gitService!.push(branchResult.branchName);
                        pushed = true;

                        // Step 5.1: Auto-merge
                        if (autoMerge && isExternalRepo) {
                            send({ type: 'progress', stage: 'merging', message: `Fusionando con ${targetBranch}...` });

                            await gitService!.checkoutBranch(targetBranch);
                            await gitService!.merge(branchResult.branchName);
                            await gitService!.push(targetBranch);

                            merged = true;
                            send({ type: 'log', message: 'Auto-merge successful!' });
                        }

                    } catch (error) {
                        console.error('Failed to push or merge:', error);
                        send({ type: 'log', message: 'Failed to push or merge' });
                    }
                }

                // Step 6: Cleanup
                if (isExternalRepo && autoCleanup && clonedRepoPath) {
                    try {
                        send({ type: 'progress', stage: 'cleanup', message: 'Limpiando archivos temporales...' });
                        await gitService!.cleanupRepository(clonedRepoPath);
                    } catch (error) {
                        console.warn('Failed to cleanup:', error);
                    }
                }

                // Final Success Response
                send({
                    type: 'complete',
                    success: true,
                    branch: branchResult.branchName,
                    filesModified,
                    modifications: modifications.map(m => ({
                        file: m.filePath,
                        explanation: m.explanation,
                    })),
                    commitHash,
                    pushed,
                    merged,
                    isExternalRepo: !!repoUrl,
                    repoUrl: isExternalRepo ? repoUrl : undefined,
                    analysis: {
                        intent: analysis.intent,
                        changes: analysis.changes,
                    }
                });

            } catch (error: any) {
                console.error('Error in code-modify:', error);
                send({ type: 'error', error: error.message || 'Ocurrió un error desconocido' });

                // Cleanup on error
                if (clonedRepoPath && gitService) {
                    try {
                        await gitService.cleanupRepository(clonedRepoPath);
                    } catch (e) {
                        // ignore
                    }
                }
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'application/json', // streaming JSON
            'Transfer-Encoding': 'chunked',
        },
    });
}
