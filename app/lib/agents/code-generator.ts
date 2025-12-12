import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

export class CodeGeneratorAgent {
  private model: ChatOpenAI | ChatAnthropic;

  constructor() {
    const provider = process.env.AI_PROVIDER || 'openai';
    
    if (provider === 'anthropic') {
      this.model = new ChatAnthropic({
        modelName: "claude-3-5-sonnet-20240620",
        temperature: 0,
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      this.model = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0,
      });
    }
  }

  async generateCode(prompt: string, currentCode: string): Promise<string> {
    console.log(`Generating code for prompt: ${prompt}`);

    const systemPrompt = `You are an expert React and Next.js developer. 
    Your task is to modify the provided code based on the user's request.
    Return ONLY the full modified code. Do not include markdown formatting (like \`\`\`tsx), explanations, or comments outside the code.
    Ensure the code is complete and functional.`;

    const userMessage = `
    Current Code:
    ${currentCode}

    User Request:
    ${prompt}

    Please provide the modified code.
    `;

    const response = await this.model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let content = response.content as string;

    // Clean up markdown code blocks if present
    content = content.replace(/^```tsx\n/, '').replace(/^```typescript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    return content;
  }
}
