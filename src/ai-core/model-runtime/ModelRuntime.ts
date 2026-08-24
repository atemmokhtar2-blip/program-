/**
 * Model Runtime
 * تشغيل النموذج المحلي مع دعم Streaming وإيقاف التوليد
 * حسب المواصفات – القسم 3 و 21
 *
 * يحاول استخدام RealLlamaRuntime (llama-cpp-python) إذا كان متاحًا،
 * وإلا يعود إلى Mock.
 */

import {
  GenerationOptions,
  GenerationResult,
  ModelInfo,
} from '../../types';
import { RealLlamaRuntime } from './RealLlamaRuntime';

export interface IModelRuntime {
  load(model: ModelInfo): Promise<void>;
  unload(): Promise<void>;
  isLoaded(): boolean;
  generate(
    prompt: string,
    systemPrompt: string | undefined,
    options: GenerationOptions
  ): Promise<GenerationResult>;
  getActiveModel(): ModelInfo | null;
}

/**
 * Mock Runtime – احتياطي فقط إذا فشل الـ real runtime
 */
class MockModelRuntime implements IModelRuntime {
  private loadedModel: ModelInfo | null = null;

  async load(model: ModelInfo): Promise<void> {
    this.loadedModel = model;
  }

  async unload(): Promise<void> {
    this.loadedModel = null;
  }

  isLoaded(): boolean {
    return this.loadedModel !== null;
  }

  getActiveModel(): ModelInfo | null {
    return this.loadedModel;
  }

  async generate(
    prompt: string,
    _systemPrompt: string | undefined,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const lower = prompt.toLowerCase();
    let text = '';

    if (
      lower.includes('سعر') ||
      lower.includes('price') ||
      lower.includes('أخبار') ||
      lower.includes('news') ||
      lower.includes('الطقس') ||
      lower.includes('weather')
    ) {
      text =
        'هذه المعلومة تحتاج مصدرًا حديثًا غير متاح حاليًا لأنني أعمل كنموذج محلي.\n\n' +
        'لا يمكنني اختلاق السعر أو الخبر.';
    } else if (lower.includes('اكتب') || lower.includes('write') || lower.includes('قصة')) {
      text =
        'إليك قصة قصيرة:\n\nفي مدينة هادئة على حافة الصحراء، عاش شاب يحلم ببناء آلة تفهم لغة الرياح...';
    } else if (lower.includes('كود') || lower.includes('code') || lower.includes('python')) {
      text =
        '```python\ndef hello_local_ai():\n    print("Hello from on-device Qwen!")\n    return "Local-first AI"\n\nhello_local_ai()\n```';
    } else {
      text =
        'أنا النموذج المحلي (Qwen Local). كيف يمكنني مساعدتك؟';
    }

    // محاكاة streaming
    const tokens = text.split(/(\s+)/);
    let generated = '';
    for (const t of tokens) {
      if (options.signal?.aborted) {
        return {
          text: generated,
          confidence: 'MEDIUM',
          finishReason: 'cancelled',
          tokensGenerated: generated.split(/\s+/).filter(Boolean).length,
        };
      }
      generated += t;
      options.onToken?.(t);
      await new Promise((r) => setTimeout(r, 15));
    }

    return {
      text: generated.trim(),
      confidence: 'MEDIUM',
      finishReason: 'stop',
      tokensGenerated: tokens.filter((t) => t.trim()).length,
    };
  }
}

/**
 * Factory: يفضل RealLlamaRuntime إذا كان ملف النموذج موجودًا
 */
export function createModelRuntime(): IModelRuntime {
  // في بيئة السيرفر: نستخدم RealLlamaRuntime
  // على الموبايل: استبدل بـ llama.rn bindings
  try {
    return new RealLlamaRuntime();
  } catch {
    return new MockModelRuntime();
  }
}

export { MockModelRuntime };
