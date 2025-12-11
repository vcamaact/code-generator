# Phase 1 Implementation Plan - Code Generator POC

This plan outlines the steps to build the Proof of Concept (POC) for the Code Generator, which allows users to modify the Darwin project UI via text prompts.

## Step 1: Setup and Infrastructure

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

## Step 2: LangChain Agent Implementation

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

## Step 3: Orchestrator (LangGraph)

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

## Step 4: Verification & Testing

- [x] **Test Case: Add Phone Field**
    - [x] Verify prompt parsing
    - [x] Verify component location
    - [x] Verify code generation (valid React code)
    - [x] Verify git branch creation and commit
    - [x] Verify build success

## Phase 2 (Integration): Integration & Self-Modification Testing

- [x] Step 1: **UI Integration**
    - Update `handleSubmit` in `app/page.tsx` to call `/api/generate`
    - Handle API response (success/error states)
    - Add loading indicator during generation

- [x] Step 2: **API & Orchestrator Updates**
    - Instantiate `Orchestrator` in `app/api/generate/route.ts`
    - Configure `CodeGeneratorAgent` to use real OpenAI API
    - Ensure `Orchestrator` targets current project directory

- [ ] Step 3: **Self-Modification Test**
    - Run scenario: "Add helper text to Feature Title"
    - Verify UI sends correct prompt
    - Verify API triggers Orchestrator
    - Verify file modification (`app/page.tsx`)
    - Verify Git branch creation
    - Verify Build success
