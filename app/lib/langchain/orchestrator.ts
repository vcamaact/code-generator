import { StateGraph, END, START } from "@langchain/langgraph";
import { CodeGeneratorAgent } from "../agents/code-generator";
import { GitOperationsAgent } from "../agents/git-operations";
import { CodeExecutorAgent } from "../agents/code-executor";
import * as fs from 'fs/promises';
import * as path from 'path';

// Define the state interface
interface AgentState {
  prompt: string;
  title?: string;
  currentCode?: string;
  modifiedCode?: string;
  branchName?: string;
  commitHash?: string;
  buildOutput?: string;
  testOutput?: string;
  error?: string;
  targetFile: string;
}

export class Orchestrator {
  private codeGenerator: CodeGeneratorAgent;
  private gitOps: GitOperationsAgent;
  private codeExecutor: CodeExecutorAgent;
  private workflow: any;

  constructor() {
    this.codeGenerator = new CodeGeneratorAgent();
    this.gitOps = new GitOperationsAgent();
    this.codeExecutor = new CodeExecutorAgent();
    this.initializeWorkflow();
  }

  private initializeWorkflow() {
    const workflow = new StateGraph<AgentState>({
      channels: {
        prompt: { reducer: (x: string) => x ?? "" },
        title: { reducer: (x: string | undefined) => x },
        currentCode: { reducer: (x: string | undefined) => x },
        modifiedCode: { reducer: (x: string | undefined) => x },
        branchName: { reducer: (x: string | undefined) => x },
        commitHash: { reducer: (x: string | undefined) => x },
        buildOutput: { reducer: (x: string | undefined) => x },
        testOutput: { reducer: (x: string | undefined) => x },
        error: { reducer: (x: string | undefined) => x },
        targetFile: { reducer: (x: string) => x ?? "app/page.tsx" },
      }
    });

    // Define nodes
    workflow.addNode("read_code", async (state: AgentState) => {
      console.log("Step: Reading Code");
      try {
        const content = await fs.readFile(state.targetFile, 'utf-8');
        return { currentCode: content };
      } catch (e: any) {
        return { error: `Failed to read file: ${e.message}` };
      }
    });

    workflow.addNode("generate_code", async (state: AgentState) => {
      console.log("Step: Generating Code");
      if (state.error) return {};
      try {
        const modified = await this.codeGenerator.generateCode(state.prompt, state.currentCode || "");
        return { modifiedCode: modified };
      } catch (e: any) {
        return { error: `Failed to generate code: ${e.message}` };
      }
    });

    workflow.addNode("create_branch", async (state: AgentState) => {
      console.log("Step: Creating Branch");
      if (state.error) return {};
      try {
        const branchName = `feature/${state.title?.toLowerCase().replace(/\s+/g, '-') || 'update-' + Date.now()}`;
        await this.gitOps.createBranch(branchName);
        return { branchName };
      } catch (e: any) {
        return { error: `Failed to create branch: ${e.message}` };
      }
    });

    workflow.addNode("write_files", async (state: AgentState) => {
      console.log("Step: Writing Files");
      if (state.error) return {};
      try {
        if (state.modifiedCode) {
          await fs.writeFile(state.targetFile, state.modifiedCode);
        }
        return {};
      } catch (e: any) {
        return { error: `Failed to write files: ${e.message}` };
      }
    });

    workflow.addNode("commit_changes", async (state: AgentState) => {
      console.log("Step: Committing Changes");
      if (state.error) return {};
      try {
        const hash = await this.gitOps.commitChanges(state.prompt);
        return { commitHash: hash };
      } catch (e: any) {
        return { error: `Failed to commit: ${e.message}` };
      }
    });

    workflow.addNode("build_and_test", async (state: AgentState) => {
      console.log("Step: Building and Testing");
      if (state.error) return {};
      try {
        // Skipping install for speed in POC if already installed
        // await this.codeExecutor.installDependencies(); 
        const build = await this.codeExecutor.buildProject();
        // const test = await this.codeExecutor.runTests();
        return { buildOutput: build };
      } catch (e: any) {
        return { error: `Build/Test failed: ${e.message}` };
      }
    });

    // Define edges
    workflow.addEdge("read_code" as any, "generate_code" as any);
    workflow.addEdge("generate_code" as any, "create_branch" as any);
    workflow.addEdge("create_branch" as any, "write_files" as any);
    workflow.addEdge("write_files" as any, "commit_changes" as any);
    workflow.addEdge("commit_changes" as any, "build_and_test" as any);
    workflow.addEdge("build_and_test" as any, END);

    workflow.addEdge(START, "read_code" as any);

    this.workflow = workflow.compile();
  }

  async run(input: { prompt: string; title?: string; targetFile?: string }) {
    const result = await this.workflow.invoke({
      prompt: input.prompt,
      title: input.title,
      targetFile: input.targetFile || "app/page.tsx"
    });
    return result;
  }
}
