import simpleGit, { SimpleGit } from 'simple-git';

export class GitOperationsAgent {
  private git: SimpleGit;

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir || process.cwd());
  }

  async createBranch(branchName: string): Promise<void> {
    console.log(`Creating branch: ${branchName}`);
    try {
      // Check if branch exists
      const branches = await this.git.branchLocal();
      if (branches.all.includes(branchName)) {
        console.log(`Branch ${branchName} already exists, checking out...`);
        await this.git.checkout(branchName);
      } else {
        await this.git.checkoutLocalBranch(branchName);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  async commitChanges(message: string): Promise<string> {
    console.log(`Committing changes with message: ${message}`);
    try {
      await this.git.add('.');
      const commitResult = await this.git.commit(message);
      return commitResult.commit;
    } catch (error) {
      console.error('Error committing changes:', error);
      throw error;
    }
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'HEAD';
  }
}
