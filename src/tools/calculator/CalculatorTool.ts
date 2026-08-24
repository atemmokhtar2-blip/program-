/**
 * Calculator Tool – أداة محلية بالكامل
 * لا تحتاج إنترنت
 */

export class CalculatorTool {
  name = 'calculator';

  async execute(expression: string): Promise<{ success: boolean; result?: number | string; error?: string }> {
    try {
      // تنظيف بسيط – فقط أرقام وعمليات أساسية
      const cleaned = expression.replace(/[^0-9+\-*/().%\s]/g, '').trim();
      if (!cleaned) {
        return { success: false, error: 'Empty expression' };
      }

      // استخدام Function بحذر (في الإنتاج يفضل parser آمن)
      // هنا محدود للعمليات الحسابية فقط
      const fn = new Function(`"use strict"; return (${cleaned})`);
      const result = fn();

      if (typeof result !== 'number' || !isFinite(result)) {
        return { success: false, error: 'Invalid calculation result' };
      }

      return { success: true, result };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Calculation failed' };
    }
  }
}
