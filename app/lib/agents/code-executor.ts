import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CodeExecutorAgent {
  private workingDir: string;

  constructor(workingDir?: string) {
    this.workingDir = workingDir || process.cwd();
  }

  private async runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    console.log(`Executing command: ${command} in ${this.workingDir}`);
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDir });
      return { stdout, stderr };
    } catch (error: any) {
      console.error(`Error executing command ${command}:`, error);
      throw {
        message: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        code: error.code
      };
    }
  }

  async installDependencies(): Promise<string> {
    const { stdout } = await this.runCommand('npm install');
    return stdout;
  }

  async buildProject(): Promise<string> {
    const { stdout } = await this.runCommand('npm run build');
    return stdout;
  }

  async runTests(): Promise<string> {
    const { stdout } = await this.runCommand('npm test');
    return stdout;
  }
}
