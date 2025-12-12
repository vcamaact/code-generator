import simpleGit, { SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';

export interface GitServiceConfig {
    projectPath: string;
    githubToken?: string;
}

export interface CreateBranchResult {
    branchName: string;
    created: boolean;
}

export interface CommitResult {
    commitHash: string;
    message: string;
}

export interface FileModification {
    filePath: string;
    content: string;
}

export class GitService {
    private git: SimpleGit;
    private projectPath: string;
    private githubToken?: string;

    constructor(config: GitServiceConfig) {
        this.projectPath = config.projectPath;
        this.githubToken = config.githubToken;
        this.git = simpleGit(this.projectPath);
    }

    /**
     * Creates a new branch with a descriptive name based on timestamp and description
     */
    async createBranch(description: string): Promise<CreateBranchResult> {
        try {
            // Generate branch name from description (sanitized)
            // User requested "solo el title", no "codex-" prefix or timestamp
            const branchName = description
                .toLowerCase()
                .replace(/[^a-z0-9-\/]+/g, '-') // Allow alphanumeric, dashes and forward slashes
                .replace(/-+/g, '-')            // Collapse multiple dashes
                .replace(/^-|-$/g, '');         // Trim dashes

            // Check if branch already exists
            const branches = await this.git.branchLocal();
            if (branches.all.includes(branchName)) {
                return { branchName, created: false };
            }

            // Create and checkout new branch
            await this.git.checkoutLocalBranch(branchName);

            return { branchName, created: true };
        } catch (error) {
            throw new Error(`Failed to create branch: ${error}`);
        }
    }

    /**
     * Reads the content of a file
     */
    async readFile(filePath: string): Promise<string> {
        try {
            const fullPath = path.join(this.projectPath, filePath);
            const content = await fs.readFile(fullPath, 'utf-8');
            return content;
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error}`);
        }
    }

    /**
     * Writes content to a file
     */
    async writeFile(filePath: string, content: string): Promise<void> {
        try {
            const fullPath = path.join(this.projectPath, filePath);

            // Ensure directory exists
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });

            await fs.writeFile(fullPath, content, 'utf-8');
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error}`);
        }
    }

    /**
     * Modifies multiple files
     */
    async modifyFiles(modifications: FileModification[]): Promise<string[]> {
        const modifiedFiles: string[] = [];

        for (const mod of modifications) {
            await this.writeFile(mod.filePath, mod.content);
            modifiedFiles.push(mod.filePath);
        }

        return modifiedFiles;
    }

    /**
     * Commits the current changes
     */
    async commit(message: string, files?: string[]): Promise<CommitResult> {
        try {
            // Add files to staging
            if (files && files.length > 0) {
                await this.git.add(files);
            } else {
                // Add all modified files
                await this.git.add('.');
            }

            // Commit
            const result = await this.git.commit(message);

            return {
                commitHash: result.commit,
                message: message,
            };
        } catch (error) {
            throw new Error(`Failed to commit: ${error}`);
        }
    }

    /**
     * Pushes the current branch to remote
     */
    async push(branchName: string, force: boolean = false): Promise<boolean> {
        try {
            console.log('[GitService] Starting push for branch:', branchName);

            // Configure remote URL with token if provided
            if (this.githubToken) {
                console.log('[GitService] Token available, configuring remote...');
                const remotes = await this.git.getRemotes(true);
                console.log('[GitService] Current remotes:', JSON.stringify(remotes, null, 2));

                if (remotes.length > 0) {
                    const remote = remotes[0];
                    const remoteUrl = remote.refs.push || remote.refs.fetch;
                    console.log('[GitService] Original remote URL:', remoteUrl);

                    if (remoteUrl && remoteUrl.includes('github.com')) {
                        // For HTTPS URLs, inject the token
                        let authenticatedUrl = remoteUrl;

                        // Remove existing token if present
                        authenticatedUrl = authenticatedUrl.replace(/https:\/\/[^@]+@github\.com\//, 'https://github.com/');

                        // Inject new token
                        authenticatedUrl = authenticatedUrl.replace(
                            'https://github.com/',
                            `https://${this.githubToken}@github.com/`
                        );

                        console.log('[GitService] Setting authenticated URL (token hidden)');
                        // Update the origin remote with authenticated URL
                        await this.git.remote(['set-url', 'origin', authenticatedUrl]);

                        // Verify the change
                        const updatedRemotes = await this.git.getRemotes(true);
                        console.log('[GitService] Updated remote URL contains token:', updatedRemotes[0]?.refs?.push?.includes('@github.com'));
                    }
                }
            }

            // Push to remote
            console.log('[GitService] Pushing to origin...');
            const pushOptions: string[] = ['--set-upstream', 'origin', branchName];
            if (force) {
                pushOptions.push('--force');
            }

            await this.git.push(pushOptions);
            console.log('[GitService] Push successful!');

            return true;
        } catch (error) {
            console.error('[GitService] Push failed:', error);
            throw new Error(`Failed to push: ${error}`);
        }
    }

    /**
     * Gets the current branch name
     */
    async getCurrentBranch(): Promise<string> {
        try {
            const status = await this.git.status();
            return status.current || 'unknown';
        } catch (error) {
            throw new Error(`Failed to get current branch: ${error}`);
        }
    }

    /**
     * Gets the status of the repository
     */
    async getStatus() {
        return await this.git.status();
    }

    /**
     * Lists all files in the project (excluding git ignored files)
     */
    async listFiles(): Promise<string[]> {
        try {
            const files = await this.git.raw(['ls-files']);
            return files.split('\n').filter(f => f.trim() !== '');
        } catch (error) {
            throw new Error(`Failed to list files: ${error}`);
        }
    }

    /**
     * Configures the Git remote
     */
    async configureRemote(remoteUrl: string, remoteName: string = 'origin'): Promise<void> {
        try {
            const remotes = await this.git.getRemotes(true);
            const existingRemote = remotes.find(r => r.name === remoteName);

            if (existingRemote) {
                // Update existing remote
                await this.git.remote(['set-url', remoteName, remoteUrl]);
            } else {
                // Add new remote
                await this.git.addRemote(remoteName, remoteUrl);
            }
        } catch (error) {
            throw new Error(`Failed to configure remote: ${error}`);
        }
    }

    /**
     * Clones a repository to a specified path with authentication
     */
    async cloneRepository(
        repoUrl: string,
        targetPath: string,
        onProgress?: (message: string) => void
    ): Promise<string> {
        try {
            onProgress?.('Preparando clonación...');

            // Ensure target directory exists
            await fs.mkdir(targetPath, { recursive: true });

            // Inject GitHub token into URL for authentication
            let authenticatedUrl = repoUrl;
            if (this.githubToken && repoUrl.includes('github.com')) {
                authenticatedUrl = repoUrl.replace(
                    'https://github.com/',
                    `https://${this.githubToken}@github.com/`
                );
            }

            onProgress?.('Clonando repositorio...');

            // Clone repository with progress handler
            const git = simpleGit({
                progress({ method, stage, progress }) {
                    if (onProgress) {
                        onProgress(`Clonando: ${stage} ${progress}%`);
                    }
                }
            });

            await git.clone(authenticatedUrl, targetPath, {
                '--depth': 1,  // Shallow clone for speed
                '--progress': null, // Enable progress output
            });

            onProgress?.('Clonación completada');

            return targetPath;
        } catch (error) {
            throw new Error(`Failed to clone repository: ${error}`);
        }
    }

    /**
     * Checks out a specific branch after cloning
     */
    async checkoutBranch(branchName: string): Promise<void> {
        try {
            await this.git.checkout(branchName);
        } catch (error) {
            throw new Error(`Failed to checkout branch ${branchName}: ${error}`);
        }
    }

    /**
     * Merges a branch into the current branch
     */
    async merge(branchName: string): Promise<void> {
        try {
            console.log(`[GitService] Merging ${branchName} into current branch`);
            await this.git.merge([branchName]);
        } catch (error) {
            console.error(`[GitService] Merge failed: ${error}`);
            throw new Error(`Failed to merge branch ${branchName}: ${error}`);
        }
    }

    /**
     * Removes a cloned repository directory
     */
    async cleanupRepository(repoPath: string): Promise<void> {
        try {
            // Ensure we're not deleting the current project
            if (repoPath === this.projectPath) {
                throw new Error('Cannot cleanup current project path');
            }

            // Delete directory recursively
            await fs.rm(repoPath, { recursive: true, force: true });
        } catch (error) {
            throw new Error(`Failed to cleanup repository: ${error}`);
        }
    }

    /**
     * Gets repository info from URL
     */
    static parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
        const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        if (match) {
            return {
                owner: match[1],
                repo: match[2].replace(/\.git$/, ''),
            };
        }
        return null;
    }
}
