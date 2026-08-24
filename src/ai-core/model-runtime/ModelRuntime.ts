/**
 * Model Runtime
 * تشغيل النموذج المحلي مع دعم Streaming وإيقاف التوليد
 * حسب المواصفات – القسم 3 و 21
 *
 * حالياً: Mock Runtime قابل للاستبدال بـ llama.rn / llama.cpp / MediaPipe
 */

import {
  GenerationOptions,
  GenerationResult,
  ConfidenceLevel,
  ModelInfo,
} from '../../types';

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
 * Mock Runtime – يحاكي Streaming و Cancellation
 * يجب استبداله بـ runtime حقيقي يدعم GGUF / Qwen
 */
export class MockModelRuntime implements IModelRuntime {
  private loadedModel: ModelInfo | null = null;
  private isGenerating = false;

  async load(model: ModelInfo): Promise<void> {
    if (this.loadedModel?.id === model.id) return;

    // في الحقيقي: تحميل الأوزان في الذاكرة
    // هنا نحاكي وقت التحميل
    await new Promise((r) => setTimeout(r, 300));
    this.loadedModel = model;
  }

  async unload(): Promise<void> {
    this.loadedModel = null;
    // في الحقيقي: تحرير الذاكرة
  }

  isLoaded(): boolean {
    return this.loadedModel !== null;
  }

  getActiveModel(): ModelInfo | null {
    return this.loadedModel;
  }

  async generate(
    prompt: string,
    systemPrompt: string | undefined,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    if (!this.loadedModel) {
      return {
        text: '',
        confidence: 'UNKNOWN',
        finishReason: 'error',
        tokensGenerated: 0,
      };
    }

    this.isGenerating = true;
    const signal = options.signal;

    // System prompt صارم ضد الهلوسة
    const antiHallucination = `
أنت مساعد ذكاء اصطناعي محلي يعمل على جهاز المستخدم.
القواعد الصارمة:
- لا تختلق معلومات.
- إذا لم تكن متأكدًا، قل ذلك بوضوح.
- لا تختلق أسعار أو أخبار أو بيانات حية.
- لا تختلق مصادر أو روابط.
- كن دقيقًا وصادقًا.
`;

    const fullSystem = (systemPrompt || '') + '\n' + antiHallucination;

    // محاكاة رد بسيط (في الحقيقي: inference)
    const mockResponse = this.buildMockResponse(prompt);

    let generated = '';
    const tokens = mockResponse.split(/(\s+)/); // تقريب بسيط

    try {
      for (const token of tokens) {
        if (signal?.aborted) {
          this.isGenerating = false;
          return {
            text: generated,
            confidence: 'MEDIUM',
            finishReason: 'cancelled',
            tokensGenerated: generated.split(/\s+/).length,
          };
        }

        generated += token;
        options.onToken?.(token);
        // تأخير بسيط لمحاكاة streaming
        await new Promise((r) => setTimeout(r, 25));
      }

      this.isGenerating = false;
      return {
        text: generated.trim(),
        confidence: 'MEDIUM',
        finishReason: 'stop',
        tokensGenerated: tokens.filter((t) => t.trim()).length,
      };
    } catch (e) {
      this.isGenerating = false;
      return {
        text: generated,
        confidence: 'LOW',
        finishReason: 'error',
        tokensGenerated: generated.split(/\s+/).length,
      };
    }
  }

  private buildMockResponse(prompt: string): string {
    const lower = prompt.toLowerCase();

    // ردود محترمة للقواعد
    if (
      lower.includes('سعر') ||
      lower.includes('price') ||
      lower.includes('أخبار') ||
      lower.includes('news') ||
      lower.includes('الطقس') ||
      lower.includes('weather')
    ) {
      return (
        'هذه المعلومة تحتاج مصدرًا حديثًا غير متاح حاليًا لأنني أعمل كنموذج محلي بدون اتصال بالإنترنت في هذه اللحظة.\n\n' +
        'عندما يتوفر الإنترنت يمكنني استخدام أدوات البحث للحصول على بيانات محدثة. حاليًا لا يمكنني اختلاق السعر أو الخبر.'
      );
    }

    if (lower.includes('اكتب') || lower.includes('write') || lower.includes('قصة')) {
      return (
        'إليك قصة قصيرة:\n\n' +
        'في مدينة هادئة على حافة الصحراء، عاش شاب يحلم ببناء آلة تفهم لغة الرياح. ' +
        'كل مساء كان يجمع الرمال ويصنع منها أشكالًا صغيرة، حتى جاء يوم اكتشف فيه أن الرمال نفسها كانت تتحدث إليه بهمس خفيف.\n\n' +
        '(تم التوليد بواسطة النموذج المحلي)'
      );
    }

    if (lower.includes('كود') || lower.includes('code') || lower.includes('python')) {
      return (
        '```python\ndef hello_local_ai():\n    print("Hello from on-device Qwen!")\n    return "Local-first AI"\n\nhello_local_ai()\n```\n\n' +
        'هذا مثال بسيط تم توليده محليًا.'
      );
    }

    return (
      'أنا النموذج المحلي (Qwen Local) وأعمل على جهازك مباشرة بدون الحاجة إلى إنترنت.\n\n' +
      'كيف يمكنني مساعدتك؟ يمكنني الكتابة، التلخيص، شرح المفاهيم، كتابة كود بسيط، والمزيد — طالما لا تحتاج بيانات حية متغيرة.'
    );
  }
}

/**
 * Factory – يمكن استبدالها بـ RealRuntime لاحقًا
 */
export function createModelRuntime(): IModelRuntime {
  // في الإنتاج: التحقق من وجود native module ثم إرجاع RealLlamaRuntime
  return new MockModelRuntime();
}
