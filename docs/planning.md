# Planning

## Project Objective

The goal of this project is to allow users to input a new "feature" they want to implement in the Darwin project from AccountTech through a prompt.

### Darwin Project Stack

The Darwin project consists of:

- **UI**: React
- **API**: .NET Core 2.0
- **Database**: SQL Server

### Initial Approach

The first idea is to utilize **LangChain** for this implementation.

---

## Proof of Concept (POC) - Phase 1

### Objective

Create a proof of concept that can:
1. Receive a simple UI form modification request via prompt
2. Create a new branch in the repository
3. Implement the requested changes
4. Execute/run the code

### Technology Stack Recommendation

#### Option 1: LangChain + LangGraph (Recommended)
- **LangChain**: For orchestrating AI agents and tools
- **LangGraph**: For creating stateful, multi-step workflows
- **OpenAI GPT-4 / Anthropic Claude**: For code generation and understanding
- **GitPython**: For Git operations (branch creation, commits)
- **Node.js/TypeScript**: For executing React code and running tests

#### Option 2: Cursor Rules + Custom Agents
- **Cursor Rules**: For code generation patterns
- **Custom Python/Node.js agents**: For orchestration
- **GitHub API / GitPython**: For repository operations

**Recommendation**: Use **LangChain + LangGraph** as it provides better structure for complex multi-step workflows and agent orchestration.

### Architecture Overview

```
┌─────────────────┐
│  User Prompt    │
│  (Next.js UI)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Next.js API Route               │
│     /api/generate                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     LangChain Agent Orchestrator     │
│     - Parse prompt                   │
│     - Plan changes                   │
│     - Generate code                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Git Operations Agent             │
│     - Create branch                  │
│     - Stage changes                  │
│     - Commit changes                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Code Execution Agent             │
│     - Install dependencies           │
│     - Run build                      │
│     - Run tests                      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Response to User                 │
│     - Branch name                    │
│     - Changes summary                │
│     - Execution results              │
└─────────────────────────────────────┘
```

### Detailed Implementation Plan

#### Phase 1.1: Setup and Infrastructure

1. **Install Dependencies**
   ```bash
   npm install langchain @langchain/openai @langchain/community
   npm install @langchain/langgraph
   npm install simple-git
   npm install @types/node
   ```

2. **Environment Variables**
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - `GITHUB_TOKEN` (for repository access)
   - `DARWIN_REPO_PATH` (local path to Darwin repository)

3. **Create API Route Structure**
   ```
   app/
   ├── api/
   │   └── generate/
   │       └── route.ts
   ├── lib/
   │   ├── agents/
   │   │   ├── code-generator.ts
   │   │   ├── git-operations.ts
   │   │   └── code-executor.ts
   │   └── langchain/
   │       └── orchestrator.ts
   ```

#### Phase 1.2: LangChain Agent Implementation

1. **Code Generator Agent**
   - **Input**: User prompt describing form modification
   - **Output**: Modified React component code
   - **Tools**:
     - File reader (read current form component)
     - Code analyzer (understand current structure)
     - Code generator (generate modifications)

2. **Git Operations Agent**
   - **Input**: Generated code changes
   - **Output**: Branch name, commit hash
   - **Tools**:
     - Branch creator (create feature branch)
     - File writer (write changes to files)
     - Git committer (stage and commit changes)

3. **Code Executor Agent**
   - **Input**: Modified code path
   - **Output**: Build/test results
   - **Tools**:
     - Dependency installer (`npm install`)
     - Build runner (`npm run build`)
     - Test runner (`npm test`)

#### Phase 1.3: Orchestrator with LangGraph

```typescript
// Workflow State
interface WorkflowState {
  prompt: string;
  featureTitle: string;
  parsedRequest: ParsedRequest;
  generatedCode: string;
  branchName: string;
  commitHash: string;
  buildResults: BuildResults;
  testResults: TestResults;
  errors: string[];
}

// Workflow Steps
1. ParsePrompt → Extract form modification requirements
2. ReadCurrentCode → Load existing form component
3. GenerateCode → Create modified component
4. CreateBranch → Create feature branch
5. WriteFiles → Save changes to files
6. CommitChanges → Commit to branch
7. InstallDependencies → Run npm install
8. BuildCode → Run npm run build
9. RunTests → Execute test suite
10. GenerateSummary → Create results summary
```

#### Phase 1.4: Specific Implementation for Form Modification

**Example Use Case**: "Add a phone number field to the user registration form"

**Steps**:
1. **Parse Request**
   - Identify: "user registration form"
   - Action: "add phone number field"
   - Type: "form field addition"

2. **Locate Component**
   - Search for: `UserRegistrationForm`, `RegisterForm`, etc.
   - Read component file
   - Understand current structure

3. **Generate Code**
   - Add phone number input field
   - Add validation if needed
   - Update form state management
   - Update submit handler if necessary

4. **Git Operations**
   - Branch: `feature/add-phone-field-registration`
   - Commit message: "Add phone number field to user registration form"

5. **Execution**
   - Install dependencies
   - Build project
   - Run tests
   - Check for TypeScript errors

### Security Considerations

1. **Repository Access**
   - Use read-only tokens for initial POC
   - Implement branch protection rules
   - Never push to main/master automatically

2. **Code Execution**
   - Run in isolated environment (Docker container recommended)
   - Timeout for long-running operations
   - Sandbox file system access

3. **API Keys**
   - Store securely in environment variables
   - Never expose in client-side code
   - Rotate keys regularly

### Error Handling Strategy

1. **Validation Errors**
   - Prompt too vague → Ask for clarification
   - Component not found → Suggest alternatives
   - Invalid modification → Explain why

2. **Git Errors**
   - Branch already exists → Use different name
   - Merge conflicts → Report to user
   - Permission denied → Check token permissions

3. **Build/Test Errors**
   - Compilation errors → Return error details
   - Test failures → Report which tests failed
   - Timeout → Report timeout and partial results

### Success Criteria for POC

- ✅ Successfully parse a simple form modification request
- ✅ Locate the correct React component
- ✅ Generate valid, working code modifications
- ✅ Create a new Git branch
- ✅ Commit changes to the branch
- ✅ Successfully build the modified code
- ✅ All tests pass (or report failures clearly)

### Next Steps After POC

1. Expand to handle more complex modifications
2. Add support for API changes (.NET Core)
3. Add support for database migrations (SQL Server)
4. Implement code review suggestions
5. Add rollback capabilities
6. Integrate with CI/CD pipeline

### Alternative Approaches to Consider

1. **GitHub Copilot API**: Direct integration with GitHub's AI
2. **Sourcegraph Cody**: Code-aware AI assistant
3. **Custom Fine-tuned Model**: Train on Darwin codebase
4. **Template-based Generation**: Use predefined templates for common changes

### Timeline Estimate

- **Week 1**: Setup infrastructure, LangChain integration
- **Week 2**: Implement agents (code generator, git operations)
- **Week 3**: Implement orchestrator, code executor
- **Week 4**: Testing, refinement, documentation

---

## Questions to Resolve

1. Do we have access to the Darwin repository? (Local clone or remote access)
2. What level of Git permissions do we need?
3. Should we execute code in a containerized environment?
4. What's the preferred AI model? (GPT-4, Claude, or other)
5. Do we need to handle authentication/authorization for the API?
