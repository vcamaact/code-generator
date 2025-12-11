import { Orchestrator } from '../app/lib/langchain/orchestrator';
import { CodeGeneratorAgent } from '../app/lib/agents/code-generator';

// Mock CodeGeneratorAgent to avoid needing API key
const originalGenerateCode = CodeGeneratorAgent.prototype.generateCode;
CodeGeneratorAgent.prototype.generateCode = async function (prompt: string, currentCode: string) {
  console.log('[MOCK] Generating code...');
  return currentCode.replace(
    'Feature Title <span className="optional">(optional)</span>',
    'Feature Title <span className="optional">(optional)</span>\n            <br/>\n            <span className="text-sm text-gray-500">Enter a descriptive title for your feature</span>'
  );
};

async function runVerification() {
  console.log('Starting POC Verification...');

  try {
    const orchestrator = new Orchestrator();
    const result = await orchestrator.run({
      prompt: "Add a helper text below the Feature Title label",
      title: "Add Helper Text"
    });

    console.log('Verification Result:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.error('Verification Failed:', result.error);
      process.exit(1);
    }

    if (result.buildOutput && result.buildOutput.includes('Compiled successfully')) {
      console.log('✅ Build Successful');
    } else {
      console.log('⚠️ Build output uncertain');
    }

    if (result.branchName && result.commitHash) {
      console.log(`✅ Git Operations Successful (Branch: ${result.branchName}, Commit: ${result.commitHash})`);
    } else {
      console.error('❌ Git Operations Failed');
      process.exit(1);
    }

    console.log('✅ Verification Completed Successfully');

  } catch (error) {
    console.error('Verification Error:', error);
    process.exit(1);
  }
}

runVerification();
