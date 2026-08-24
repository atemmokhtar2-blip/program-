/**
 * AI Core – المنسق الرئيسي
 * يجمع ModelManager + AIRouter + ModelRuntime + ContextManager
 */

import { ModelManager, BUNDLED_QWEN } from './model-manager/ModelManager';
import { AIRouter } from './ai-router/AIRouter';
import { createModelRuntime, IModelRuntime } from './model-runtime/ModelRuntime';
import { ContextManager } from './context-manager/ContextManager';
import {
  Conversation,
  Message,
  Task,
  TaskState,
  GenerationOptions,
  ConfidenceLevel,
} from '../types';

export class AICore {
  public modelManager: ModelManager;
  public router: AIRouter;
  public runtime: IModelRuntime;
  public context: ContextManager;

  private currentTask: Task | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.modelManager = new ModelManager();
    this.router = new AIRouter();
    this.runtime = createModelRuntime();
    this.context = new ContextManager();
  }

  async initialize(): Promise<void> {
    await this.modelManager.detectDevice();
    // تحميل النموذج المدمج افتراضيًا
    const bundled = this.modelManager.getBundledModel();
    this.modelManager.setActiveModel(bundled.id);
    await this.runtime.load(bundled);
  }

  getCurrentTask(): Task | null {
    return this.currentTask;
  }

  /**
   * معالجة طلب المستخدم بالكامل
   */
  async processUserMessage(
    conversation: Conversation,
    userText: string,
    hasInternet: boolean,
    onToken?: (token: string) => void,
    onStateChange?: (state: TaskState) => void
  ): Promise<{ message: Message; task: Task }> {
    const taskId = `task_${Date.now()}`;
    this.currentTask = {
      id: taskId,
      state: 'IDLE',
      userRequest: userText,
      usedTools: [],
      startedAt: Date.now(),
    };

    const updateState = (state: TaskState) => {
      if (this.currentTask) {
        this.currentTask.state = state;
        onStateChange?.(state);
      }
    };

    try {
      // 1. تحليل
      updateState('ANALYZING');
      const analysis = this.router.analyze(userText, hasInternet);
      this.currentTask.analysis = analysis;

      // 2. قرار الـ Router
      const activeModel = this.modelManager.getActiveModel() || this.modelManager.getBundledModel();
      const decision = this.router.decide(analysis, hasInternet, activeModel.id);

      // 3. إذا كانت تحتاج أدوات إنترنت ولم يتوفر الإنترنت → رد صريح
      if (analysis.needsLiveData && !hasInternet) {
        updateState('PROCESSING');
        const text =
          'هذه المعلومة تحتاج مصدرًا حديثًا غير متاح حاليًا (لا يوجد اتصال بالإنترنت).\n\n' +
          'لا يمكنني اختلاق السعر أو الخبر أو البيانات الحية. عندما يتوفر الإنترنت يمكنني استخدام أدوات البحث.';

        const msg = this.context.createMessage('assistant', text, activeModel.id, 'UNKNOWN');
        this.currentTask.state = 'COMPLETED';
        this.currentTask.result = text;
        this.currentTask.confidence = 'UNKNOWN';
        this.currentTask.finishedAt = Date.now();
        updateState('COMPLETED');
        return { message: msg, task: this.currentTask };
      }

      // 4. تشغيل النموذج المحلي
      updateState('RUNNING');

      // التأكد من تحميل النموذج
      if (!this.runtime.isLoaded() || this.runtime.getActiveModel()?.id !== activeModel.id) {
        await this.runtime.load(activeModel);
      }

      this.abortController = new AbortController();

      const { system } = this.context.buildPrompt(conversation, userText);

      const result = await this.runtime.generate(userText, system, {
        onToken,
        signal: this.abortController.signal,
        maxTokens: 1024,
        temperature: 0.7,
      });

      const confidence = this.router.assessConfidence(
        decision.route,
        analysis.needsLiveData,
        true
      );

      const msg = this.context.createMessage(
        'assistant',
        result.text,
        activeModel.id,
        confidence
      );

      this.currentTask.state = result.finishReason === 'cancelled' ? 'CANCELLED' : 'COMPLETED';
      this.currentTask.result = result.text;
      this.currentTask.confidence = confidence;
      this.currentTask.finishedAt = Date.now();
      updateState(this.currentTask.state);

      return { message: msg, task: this.currentTask };
    } catch (error: any) {
      updateState('FAILED');
      const errorMsg = error?.message || 'حدث خطأ غير متوقع أثناء التنفيذ.';
      this.currentTask!.error = errorMsg;
      this.currentTask!.finishedAt = Date.now();

      const msg = this.context.createMessage(
        'assistant',
        `Task Failed\nReason: ${errorMsg}\n\nيمكنك إعادة المحاولة أو الإلغاء.`,
        undefined,
        'UNKNOWN'
      );
      return { message: msg, task: this.currentTask! };
    } finally {
      this.abortController = null;
    }
  }

  /** إيقاف التوليد */
  stopGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.currentTask && this.currentTask.state === 'RUNNING') {
      this.currentTask.state = 'CANCELLED';
      this.currentTask.finishedAt = Date.now();
    }
  }

  /** تحرير الذاكرة */
  async releaseMemory(): Promise<void> {
    await this.runtime.unload();
  }
}
