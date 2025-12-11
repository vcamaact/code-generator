# Implementation Plan - Code Generator POC

This plan outlines the steps to build the Proof of Concept (POC) for the Code Generator, which allows users to modify the Darwin project UI via text prompts.

## Phase 1: Setup and Infrastructure

- [x] **Install Dependencies**
    - `langchain`, `@langchain/openai`, `@langchain/community`
    - `@langchain/langgraph`
    - `simple-git`
    - `@types/node`
- [x] **Configure Environment**
    - Set up `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
    - Set up `GITHUB_TOKEN`
    - Define `DARWIN_REPO_PATH`
- [x] **Project Structure**
    - Create API route: `app/api/generate/route.ts`
    - Create lib directories: `app/lib/agents`, `app/lib/langchain`

## Phase 2: LangChain Agent Implementation

### Code Generator Agent
- [x] **Define Input/Output**: User prompt -> Modified React Code
- [x] **Implement Tools**:
    - File Reader (read existing component)
    - Code Analyzer (understand structure)
    - Code Generator (apply changes)

### Git Operations Agent
- [x] **Define Input/Output**: Generated Code -> Branch/Commit
- [x] **Implement Tools**:
    - Branch Creator
    - File Writer
    - Git Committer

### Code Executor Agent
- [x] **Define Input/Output**: Path -> Build Results
- [x] **Implement Tools**:
    - Dependency Installer
    - Build Runner
    - Test Runner

## Phase 3: Orchestrator (LangGraph)

- [x] **Define Workflow State**
    - Prompt, Feature Title, Parsed Request, Code, Git Info, Results
- [x] **Implement Workflow Steps/Nodes**
    - `ParsePrompt`
    - `ReadCurrentCode`
    - `GenerateCode`
    - `CreateBranch`
    - `WriteFiles`
    - `CommitChanges`
    - `InstallDependencies`
    - `BuildCode`
    - `RunTests`
    - `GenerateSummary`

## Phase 4: Verification & Testing

- [x] **Test Case: Add Phone Field**
    - [x] Verify prompt parsing
    - [x] Verify component location
    - [x] Verify code generation (valid React code)
    - [x] Verify git branch creation and commit
    - [x] Verify build success
