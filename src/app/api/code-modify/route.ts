import { NextResponse } from 'next/server';
import { GitService } from '@/lib/GitService';
import { CodexService } from '@/lib/CodexService';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const TEMP_REPOS_DIR = path.join(PROJECT_ROOT, '.temp-repos');

export async function POST(request: Request) {
    let clonedRepoPath: string | null = null;

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

        const {
            prompt,
            commitTitle,       // NEW: Custom commit title
            files,
            repoUrl,           // NEW: External repository URL
            targetBranch = 'main',  // NEW: Base branch
            autoCommit = true,
            autoPush = false,
            autoCleanup = true,     // NEW: Cleanup temp repos
            autoMerge = false       // NEW: Auto-merge option
        } = await request.json();

        console.log('[code-modify] Parsed request:', {
            prompt: prompt?.substring(0, 50),
            isExternalRepo: !!repoUrl,
            autoCommit,
            autoPush
        });

        if (!prompt) {
            return NextResponse.json(
                { error: 'Se requiere un prompt' },
                { status: 400 }
            );
        }

        // Determine working directory
        let workingPath = PROJECT_ROOT;
        let isExternalRepo = false;

        // Handle external repository
        if (repoUrl) {
            isExternalRepo = true;
            const repoInfo = GitService.parseRepoUrl(repoUrl);

            if (!repoInfo) {
                return NextResponse.json(
                    { error: 'URL de repositorio inválida. Use formato: https://github.com/owner/repo.git' },
                    { status: 400 }
                );
            }

            // Create unique temp directory for this repo
            const timestamp = Date.now();
            clonedRepoPath = path.join(TEMP_REPOS_DIR, `${repoInfo.owner}-${repoInfo.repo}-${timestamp}`);
            workingPath = clonedRepoPath;

            console.log('[code-modify] Cloning external repository...');

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

            console.log('[code-modify] Starting clone...');

            // Clone repository
            const git = simpleGit();
            await git.clone(authenticatedUrl, clonedRepoPath, {
                '--depth': 1,  // Shallow clone for speed
            });

            console.log('[code-modify] Repository cloned successfully');

            // Configure git to not use credential helper for this repo
            const clonedGit = simpleGit(clonedRepoPath);

            // Disable ALL credential helpers (local config overrides global)
            await clonedGit.addConfig('credential.helper', '', false, 'local');

            // Prevent git from prompting for credentials
            await clonedGit.addConfig('core.askpass', '', false, 'local');

            // Use only the credentials in the URL
            await clonedGit.addConfig('credential.useHttpPath', 'true', false, 'local');

            console.log('[code-modify] Disabled credential helper for cloned repo');
        }

        // Initialize services with working path
        console.log('[code-modify] Initializing services...');
        console.log('[code-modify] GitHub token available:', !!process.env.GITHUB_TOKEN);
        console.log('[code-modify] Token prefix:', process.env.GITHUB_TOKEN?.substring(0, 10) + '...');

        const gitService = new GitService({
            projectPath: workingPath,
            githubToken: process.env.GITHUB_TOKEN,
        });

        const codexService = new CodexService({
            apiKey: apiKey,
            provider: provider as 'openai' | 'groq',
            model: provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
        });
        console.log('[code-modify] Services initialized successfully');

        // If external repo, checkout target branch
        if (isExternalRepo && targetBranch) {
            try {
                await gitService.checkoutBranch(targetBranch);
                console.log(`[code-modify] Checked out branch: ${targetBranch}`);
            } catch (error) {
                console.warn(`[code-modify] Could not checkout ${targetBranch}, using default branch`);
            }
        }

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
        // Use commit title for branch name if provided, otherwise use analysis intent
        const branchDescription = commitTitle || analysis.intent;
        const branchResult = await gitService.createBranch(branchDescription);

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
            // Use custom title if provided, otherwise generate with AI
            const commitMessage = commitTitle || await codexService.generateCommitMessage(modifications);
            const commitResult = await gitService.commit(commitMessage, filesModified);
            commitHash = commitResult.commitHash;
        }

        // Step 5: Push changes (if autoPush is enabled)
        let pushed = false;
        let merged = false;

        if (autoPush && commitHash) {
            try {
                // Push feature branch first
                await gitService.push(branchResult.branchName);
                pushed = true;

                // Step 5.1: Auto-merge to target branch if requested
                if (autoMerge && isExternalRepo) {
                    console.log(`[code-modify] Auto-merging ${branchResult.branchName} into ${targetBranch}...`);

                    // Checkout target branch
                    await gitService.checkoutBranch(targetBranch);

                    // Merge feature branch
                    await gitService.merge(branchResult.branchName);

                    // Push target branch
                    await gitService.push(targetBranch);

                    merged = true;
                    console.log(`[code-modify] Auto-merge successful!`);
                }

            } catch (error) {
                console.error('Failed to push or merge:', error);
                // Don't fail the entire request if push fails
            }
        }

        // Step 6: Cleanup cloned repository if requested
        if (isExternalRepo && autoCleanup && clonedRepoPath) {
            try {
                console.log('[code-modify] Cleaning up cloned repository...');
                await gitService.cleanupRepository(clonedRepoPath);
                console.log('[code-modify] Cleanup completed');
            } catch (error) {
                console.warn('[code-modify] Failed to cleanup:', error);
                // Don't fail if cleanup fails
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
            merged,
            isExternalRepo: !!repoUrl,
            repoUrl: isExternalRepo ? repoUrl : undefined,
            analysis: {
                intent: analysis.intent,
                changes: analysis.changes,
            },
        });

    } catch (error: any) {
        console.error('Error in code-modify:', error);

        // Cleanup on error if we cloned a repo
        if (clonedRepoPath) {
            try {
                const cleanupGitService = new GitService({
                    projectPath: clonedRepoPath,
                    githubToken: process.env.GITHUB_TOKEN,
                });
                await cleanupGitService.cleanupRepository(clonedRepoPath);
            } catch (cleanupError) {
                console.error('Failed to cleanup on error:', cleanupError);
            }
        }

        return NextResponse.json(
            {
                error: 'Error al procesar la solicitud',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
