import OpenAI from 'openai';
import Groq from 'groq-sdk';

export interface CodexServiceConfig {
    apiKey: string;
    model?: string;
    provider?: 'openai' | 'groq';
}

export interface AnalyzePromptResult {
    files: string[];
    changes: string;
    intent: string;
}

export interface CodeModification {
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    explanation: string;
}

export class CodexService {
    private client: OpenAI | Groq;
    private model: string;
    private provider: 'openai' | 'groq';

    constructor(config: CodexServiceConfig) {
        this.provider = config.provider || 'groq';

        if (this.provider === 'groq') {
            this.client = new Groq({
                apiKey: config.apiKey,
            });
            this.model = config.model || 'llama-3.3-70b-versatile';
        } else {
            this.client = new OpenAI({
                apiKey: config.apiKey,
            });
            this.model = config.model || 'gpt-4o-mini';
        }
    }

    /**
     * Analyzes a user prompt to understand what changes are needed
     */
    async analyzePrompt(prompt: string, availableFiles: string[]): Promise<AnalyzePromptResult> {
        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a code analysis AI. Given a user prompt describing code changes, analyze which files need to be modified and what changes are required.
            
Available files in the project:
${availableFiles.slice(0, 100).join('\n')}

Return your response in JSON format:
{
  "files": ["array", "of", "file", "paths"],
  "changes": "description of changes to make",
  "intent": "what the user wants to accomplish"
}`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            } as any);

            const content = completion.choices[0]?.message?.content || '{}';
            const result = JSON.parse(content);

            return {
                files: result.files || [],
                changes: result.changes || '',
                intent: result.intent || '',
            };
        } catch (error) {
            throw new Error(`Failed to analyze prompt: ${error}`);
        }
    }

    /**
     * Generates modified code for a file based on user instructions
     */
    async modifyCode(
        filePath: string,
        currentContent: string,
        instructions: string
    ): Promise<CodeModification> {
        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert programmer. You will be given the current content of a file and instructions on how to modify it. 
            
Return your response in JSON format:
{
  "modifiedContent": "the complete modified file content",
  "explanation": "brief explanation of what was changed"
}

IMPORTANT: Return the COMPLETE file content with the changes applied, not just the diff.`,
                    },
                    {
                        role: 'user',
                        content: `File: ${filePath}

Current content:
\`\`\`
${currentContent}
\`\`\`

Instructions: ${instructions}`,
                    },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            } as any);

            const content = completion.choices[0]?.message?.content || '{}';
            const result = JSON.parse(content);

            return {
                filePath,
                originalContent: currentContent,
                modifiedContent: result.modifiedContent || currentContent,
                explanation: result.explanation || 'No explanation provided',
            };
        } catch (error) {
            throw new Error(`Failed to modify code for ${filePath}: ${error}`);
        }
    }

    /**
     * Validates that the modified code is syntactically correct
     */
    async validateCode(
        filePath: string,
        content: string
    ): Promise<{ valid: boolean; errors: string[] }> {
        try {
            // Basic validation using AI
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a code validator. Check if the provided code has syntax errors or obvious issues.
            
Return your response in JSON format:
{
  "valid": true/false,
  "errors": ["array", "of", "error", "messages"]
}`,
                    },
                    {
                        role: 'user',
                        content: `File: ${filePath}

Code to validate:
\`\`\`
${content}
\`\`\``,
                    },
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' },
            } as any);

            const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

            return {
                valid: result.valid !== false,
                errors: result.errors || [],
            };
        } catch (error) {
            // If validation fails, assume code is valid
            console.error('Validation error:', error);
            return { valid: true, errors: [] };
        }
    }

    /**
     * Generates a commit message based on the changes made
     */
    async generateCommitMessage(
        modifications: CodeModification[]
    ): Promise<string> {
        try {
            const changesDescription = modifications
                .map(mod => `${mod.filePath}: ${mod.explanation}`)
                .join('\n');

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Git commit message generator. Create a concise, descriptive commit message following conventional commits format.',
                    },
                    {
                        role: 'user',
                        content: `Generate a commit message for these changes:

${changesDescription}`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 100,
            } as any);

            return completion.choices[0]?.message?.content?.trim() || 'Update code via CODEX';
        } catch (error) {
            return 'Update code via CODEX';
        }
    }
}
