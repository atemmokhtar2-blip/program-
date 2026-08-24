/**
 * Real Model Runtime using llama-cpp-python (via Python bridge)
 * أو يمكن استبداله بـ llama.rn على React Native
 *
 * يقرأ ملف GGUF الحقيقي ويقوم بـ inference فعلي + streaming
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  GenerationOptions,
  GenerationResult,
  ModelInfo,
  ConfidenceLevel,
} from '../../types';
import { IModelRuntime } from './ModelRuntime';

const ANTI_HALLUCINATION_SYSTEM = `أنت مساعد ذكاء اصطناعي محلي يعمل على جهاز المستخدم.
القواعد الصارمة:
- لا تختلق معلومات.
- إذا لم تكن متأكدًا، قل ذلك بوضوح.
- لا تختلق أسعار أو أخبار أو بيانات حية.
- لا تختلق مصادر أو روابط.
- كن دقيقًا وصادقًا.
- أجب باللغة العربية إذا كان السؤال بالعربية.`;

/**
 * Runtime حقيقي يعتمد على استدعاء Python + llama-cpp-python
 * يعمل على السيرفر الحالي. على الموبايل يُستبدل بـ llama.rn
 */
export class RealLlamaRuntime implements IModelRuntime {
  private loadedModel: ModelInfo | null = null;
  private modelPath: string | null = null;

  async load(model: ModelInfo): Promise<void> {
    if (!model.localPath || !fs.existsSync(model.localPath)) {
      throw new Error(`Model file not found: ${model.localPath}`);
    }
    this.loadedModel = model;
    this.modelPath = model.localPath;
  }

  async unload(): Promise<void> {
    this.loadedModel = null;
    this.modelPath = null;
  }

  isLoaded(): boolean {
    return this.loadedModel !== null && this.modelPath !== null;
  }

  getActiveModel(): ModelInfo | null {
    return this.loadedModel;
  }

  async generate(
    prompt: string,
    systemPrompt: string | undefined,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    if (!this.modelPath || !this.isLoaded()) {
      return {
        text: '',
        confidence: 'UNKNOWN',
        finishReason: 'error',
        tokensGenerated: 0,
      };
    }

    const system = (systemPrompt || '') + '\n' + ANTI_HALLUCINATION_SYSTEM;
    const fullPrompt = `<|im_start|>system\n${system}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;

    const script = `
import sys
from llama_cpp import Llama

model_path = ${JSON.stringify(this.modelPath)}
prompt = ${JSON.stringify(fullPrompt)}
max_tokens = ${options.maxTokens || 512}
temperature = ${options.temperature || 0.7}

try:
    llm = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=2,
        verbose=False,
    )
    stream = llm(
        prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        stop=["<|im_end|>", "<|endoftext|>"],
        stream=True,
    )
    for chunk in stream:
        token = chunk["choices"][0].get("text", "")
        if token:
            sys.stdout.write(token)
            sys.stdout.flush()
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

    return new Promise((resolve) => {
      let generated = '';
      let finished = false;
      const signal = options.signal;

      const proc = spawn('python3', ['-c', script], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const onAbort = () => {
        if (!finished) {
          proc.kill('SIGTERM');
          finished = true;
          resolve({
            text: generated,
            confidence: 'MEDIUM',
            finishReason: 'cancelled',
            tokensGenerated: generated.split(/\s+/).filter(Boolean).length,
          });
        }
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort);
      }

      proc.stdout.on('data', (data: Buffer) => {
        const token = data.toString();
        generated += token;
        options.onToken?.(token);
      });

      proc.stderr.on('data', (data: Buffer) => {
        // يمكن تسجيل الأخطاء
      });

      proc.on('close', (code) => {
        if (finished) return;
        finished = true;
        if (signal) signal.removeEventListener('abort', onAbort);

        if (code !== 0 && !generated) {
          resolve({
            text: '',
            confidence: 'UNKNOWN',
            finishReason: 'error',
            tokensGenerated: 0,
          });
          return;
        }

        resolve({
          text: generated.trim(),
          confidence: 'MEDIUM',
          finishReason: 'stop',
          tokensGenerated: generated.split(/\s+/).filter(Boolean).length,
        });
      });

      proc.on('error', () => {
        if (finished) return;
        finished = true;
        resolve({
          text: generated,
          confidence: 'LOW',
          finishReason: 'error',
          tokensGenerated: generated.split(/\s+/).filter(Boolean).length,
        });
      });
    });
  }
}
