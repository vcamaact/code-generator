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
            // Generate branch name: codex-<timestamp>-<sanitized-description>
            const timestamp = Date.now();
            const sanitizedDesc = description
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .substring(0, 50)
                .replace(/^-|-$/g, '');

            const branchName = `codex-${timestamp}-${sanitizedDesc}`;

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
            // Configure remote URL with token if provided
            if (this.githubToken) {
                const remotes = await this.git.getRemotes(true);
                if (remotes.length > 0) {
                    const remote = remotes[0];
                    const remoteUrl = remote.refs.push;

                    if (remoteUrl && remoteUrl.includes('github.com')) {
                        // For HTTPS URLs, inject the token
                        const authenticatedUrl = remoteUrl.replace(
                            'https://github.com/',
                            `https://${this.githubToken}@github.com/`
                        );

                        await this.git.addRemote('origin-auth', authenticatedUrl).catch(() => {
                            // Remote might already exist, update it
                        });
                    }
                }
            }

            // Push to remote
            const pushOptions: string[] = ['--set-upstream', 'origin', branchName];
            if (force) {
                pushOptions.push('--force');
            }

            await this.git.push(pushOptions);

            return true;
        } catch (error) {
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
}
