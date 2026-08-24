/**
 * Model Manager
 * مسؤول عن اكتشاف / تنزيل / تشغيل / حذف النماذج المحلية
 * حسب المواصفات التنفيذية – القسم 4 و 5
 */

import {
  DeviceCapability,
  DeviceInfo,
  ModelInfo,
  ModelStatus,
  Quantization,
} from '../../types';

/** النموذج المدمج الأساسي – Qwen خفيف */
export const BUNDLED_QWEN: ModelInfo = {
  id: 'qwen-local-bundled',
  name: 'Qwen Local',
  version: '2.5-0.5B',
  sizeBytes: 450 * 1024 * 1024, // ~450 MB تقدير لـ 4-bit
  quantization: 'Q4_K_M',
  ramRequirementGB: 1.2,
  capabilities: ['chat', 'instruction', 'streaming', 'stop-generation'],
  status: 'installed',
  isBundled: true,
  localPath: 'bundled://qwen-local',
};

/** أمثلة نماذج إضافية يمكن تنزيلها */
export const AVAILABLE_MODELS: ModelInfo[] = [
  BUNDLED_QWEN,
  {
    id: 'qwen-1.5b-q4',
    name: 'Qwen 1.5B',
    version: '2.5-1.5B',
    sizeBytes: 1100 * 1024 * 1024,
    quantization: 'Q4_K_M',
    ramRequirementGB: 2.5,
    capabilities: ['chat', 'instruction', 'coding', 'streaming'],
    status: 'not_installed',
    isBundled: false,
  },
  {
    id: 'qwen-coder-3b',
    name: 'Qwen Coder 3B',
    version: '2.5-Coder-3B',
    sizeBytes: 2200 * 1024 * 1024,
    quantization: 'Q4_K_M',
    ramRequirementGB: 4.0,
    capabilities: ['coding', 'chat', 'streaming'],
    status: 'not_installed',
    isBundled: false,
  },
  {
    id: 'qwen-7b-q4',
    name: 'Qwen 7B',
    version: '2.5-7B',
    sizeBytes: 4500 * 1024 * 1024,
    quantization: 'Q4_K_M',
    ramRequirementGB: 7.5,
    capabilities: ['chat', 'reasoning', 'coding', 'streaming'],
    status: 'not_installed',
    isBundled: false,
  },
];

export class ModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private deviceInfo: DeviceInfo | null = null;
  private activeModelId: string | null = null;

  constructor() {
    // تحميل النماذج المعروفة
    AVAILABLE_MODELS.forEach((m) => this.models.set(m.id, { ...m }));
  }

  /** فحص مواصفات الجهاز محليًا */
  async detectDevice(): Promise<DeviceInfo> {
    // في تطبيق حقيقي: استخدام native modules لقراءة RAM / CPU / etc.
    // هنا نستخدم قيم افتراضية آمنة (يمكن استبدالها لاحقًا)
    const info: DeviceInfo = {
      ramGB: 6, // مثال
      cpuCores: 8,
      architecture: 'arm64-v8a',
      availableStorageGB: 20,
      hasGpuAcceleration: true,
      os: 'Android',
      osVersion: '14',
      capability: 'MEDIUM',
    };

    // تصنيف القدرة
    if (info.ramGB < 4) {
      info.capability = 'LOW';
    } else if (info.ramGB < 8) {
      info.capability = 'MEDIUM';
    } else if (info.ramGB < 12) {
      info.capability = 'HIGH';
    } else {
      info.capability = 'ULTRA';
    }

    this.deviceInfo = info;
    return info;
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  getCapability(): DeviceCapability {
    return this.deviceInfo?.capability ?? 'LOW';
  }

  /** قائمة كل النماذج */
  listModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  getModel(id: string): ModelInfo | undefined {
    return this.models.get(id);
  }

  getBundledModel(): ModelInfo {
    return this.models.get(BUNDLED_QWEN.id)!;
  }

  getActiveModel(): ModelInfo | null {
    if (!this.activeModelId) return null;
    return this.models.get(this.activeModelId) ?? null;
  }

  setActiveModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model || model.status !== 'installed') {
      return false;
    }

    // منع تشغيل نموذج غير مناسب للجهاز
    if (!this.canRunModel(model)) {
      return false;
    }

    this.activeModelId = id;
    return true;
  }

  /** هل الجهاز يقدر يشغل هذا النموذج؟ */
  canRunModel(model: ModelInfo): boolean {
    const device = this.deviceInfo;
    if (!device) return model.isBundled; // النموذج المدمج يُسمح دائمًا تقريبًا

    // قاعدة صارمة: لا تسمح بنموذج يحتاج أكثر من 80% من الـ RAM
    if (model.ramRequirementGB > device.ramGB * 0.8) {
      return false;
    }

    // على LOW لا تسمح بنماذج أكبر من 2GB تقريبًا
    if (device.capability === 'LOW' && model.ramRequirementGB > 2.0) {
      return false;
    }

    return true;
  }

  /** بدء تنزيل نموذج */
  async downloadModel(
    id: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const model = this.models.get(id);
    if (!model) {
      return { success: false, error: 'Model not found' };
    }
    if (model.status === 'installed') {
      return { success: true };
    }
    if (model.isBundled) {
      return { success: true };
    }

    // تحقق من المساحة
    const device = this.deviceInfo;
    if (device && model.sizeBytes / (1024 * 1024 * 1024) > device.availableStorageGB * 0.9) {
      return { success: false, error: 'Insufficient storage space' };
    }

    model.status = 'downloading';
    model.downloadProgress = 0;

    // محاكاة التحميل (في التطبيق الحقيقي: download + verify checksum)
    // هنا placeholder – يجب استبداله بـ real download إلى FileSystem
    try {
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => setTimeout(r, 200));
        model.downloadProgress = i / 10;
        onProgress?.(model.downloadProgress);
      }

      // بعد التحميل الناجح
      model.status = 'installed';
      model.localPath = `models/${id}.gguf`;
      model.downloadProgress = 1;
      this.models.set(id, { ...model });
      return { success: true };
    } catch (e) {
      model.status = 'error';
      model.downloadProgress = 0;
      return { success: false, error: 'Model download failed. The model was not installed.' };
    }
  }

  /** إيقاف التحميل (placeholder) */
  cancelDownload(id: string): void {
    const model = this.models.get(id);
    if (model && model.status === 'downloading') {
      model.status = 'not_installed';
      model.downloadProgress = 0;
    }
  }

  /** حذف نموذج */
  async deleteModel(id: string): Promise<{ success: boolean; error?: string }> {
    const model = this.models.get(id);
    if (!model) return { success: false, error: 'Model not found' };
    if (model.isBundled) {
      return { success: false, error: 'Cannot delete the bundled model' };
    }
    if (this.activeModelId === id) {
      this.activeModelId = BUNDLED_QWEN.id; // العودة للنموذج المدمج
    }

    model.status = 'not_installed';
    model.localPath = undefined;
    model.downloadProgress = 0;
    // في الحقيقي: حذف الملف من التخزين
    return { success: true };
  }

  /** التحقق من سلامة الملف (placeholder) */
  async verifyModelIntegrity(id: string): Promise<boolean> {
    const model = this.models.get(id);
    if (!model || model.status !== 'installed') return false;
    // في الحقيقي: checksum / magic header check
    return true;
  }
}
