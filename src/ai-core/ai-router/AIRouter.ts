/**
 * AI Router
 * طبقة القرار: Local AI vs Internet Tools
 * حسب المواصفات – القسم 8
 */

import {
  AIRouterDecision,
  TaskAnalysis,
  ConfidenceLevel,
} from '../../types';

export class AIRouter {
  /**
   * تحليل الطلب وتحديد المسار
   */
  analyze(userRequest: string, hasInternet: boolean): TaskAnalysis {
    const lower = userRequest.toLowerCase().trim();

    // كلمات تدل على بيانات حية / متغيرة
    const liveDataKeywords = [
      'سعر', 'price', 'أخبار', 'news', 'الطقس', 'weather',
      'اليوم', 'today', 'الآن', 'now', 'الحالي', 'current',
      'آخر', 'latest', 'نتائج', 'score', 'مباراة', 'match',
      'إصدار', 'version', 'release', 'حالة', 'status',
      'هل يعمل', 'is down', 'outage',
    ];

    const needsLiveData = liveDataKeywords.some((k) => lower.includes(k));

    // مهام محلية واضحة
    const localKeywords = [
      'اكتب', 'write', 'قصة', 'story', 'كود', 'code', 'python',
      'لخص', 'summarize', 'ترجم', 'translate', 'اشرح', 'explain',
      'فكرة', 'idea', 'خطة', 'plan', 'رسالة', 'email',
    ];

    const isClearlyLocal = localKeywords.some((k) => lower.includes(k));

    let suggestedRoute: TaskAnalysis['suggestedRoute'] = 'LOCAL_AI';
    let requiredTools: string[] = [];
    let reason = 'المهمة يمكن تنفيذها بالنموذج المحلي.';

    if (needsLiveData) {
      if (hasInternet) {
        suggestedRoute = 'INTERNET_TOOL';
        requiredTools = this.detectRequiredTools(lower);
        reason = 'المهمة تحتاج بيانات حديثة غير متوفرة في النموذج المحلي.';
      } else {
        suggestedRoute = 'LOCAL_AI';
        reason =
          'المهمة تحتاج بيانات حديثة، لكن الإنترنت غير متوفر. سيتم إخبار المستخدم بذلك بدل اختلاق إجابة.';
      }
    } else if (isClearlyLocal) {
      suggestedRoute = 'LOCAL_AI';
      reason = 'مهمة توليد / تلخيص / كتابة – مناسبة للنموذج المحلي.';
    }

    const estimatedComplexity: TaskAnalysis['estimatedComplexity'] =
      userRequest.length > 300 || lower.includes('كود طويل') ? 'high' : 'medium';

    return {
      needsLiveData,
      suggestedRoute,
      requiredTools,
      estimatedComplexity,
      reason,
    };
  }

  /**
   * اتخاذ القرار النهائي
   */
  decide(
    analysis: TaskAnalysis,
    hasInternet: boolean,
    preferredModelId?: string
  ): AIRouterDecision {
    if (analysis.suggestedRoute === 'INTERNET_TOOL' && hasInternet) {
      return {
        route: 'INTERNET_TOOL',
        tools: analysis.requiredTools,
        reason: analysis.reason,
      };
    }

    if (analysis.suggestedRoute === 'HYBRID' && hasInternet) {
      return {
        route: 'HYBRID',
        modelId: preferredModelId,
        tools: analysis.requiredTools,
        reason: analysis.reason,
      };
    }

    // الافتراضي دائمًا: Local AI
    return {
      route: 'LOCAL_AI',
      modelId: preferredModelId,
      tools: [],
      reason: analysis.reason,
    };
  }

  private detectRequiredTools(lower: string): string[] {
    const tools: string[] = [];
    if (lower.includes('بحث') || lower.includes('search') || lower.includes('أخبار') || lower.includes('news')) {
      tools.push('search');
    }
    if (lower.includes('صفحة') || lower.includes('موقع') || lower.includes('url') || lower.includes('رابط')) {
      tools.push('browser');
    }
    if (lower.includes('سعر') || lower.includes('price')) {
      tools.push('search');
    }
    if (tools.length === 0) {
      tools.push('search'); // افتراضي للبيانات الحية
    }
    return tools;
  }

  /**
   * تقييم الثقة حسب القواعد الصارمة
   */
  assessConfidence(
    route: AIRouterDecision['route'],
    hasLiveData: boolean,
    toolSucceeded: boolean
  ): ConfidenceLevel {
    if (route === 'LOCAL_AI' && !hasLiveData) {
      return 'MEDIUM'; // النموذج المحلي جيد للمهام العامة
    }
    if (route === 'INTERNET_TOOL' && toolSucceeded) {
      return 'HIGH';
    }
    if (route === 'INTERNET_TOOL' && !toolSucceeded) {
      return 'UNKNOWN';
    }
    return 'LOW';
  }
}
