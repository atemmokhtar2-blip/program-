/**
 * Model Manager
 * مسؤول عن اكتشاف / تنزيل / تشغيل / حذف النماذج المحلية
 * حسب المواصفات التنفيذية – القسم 4 و 5
 *
 * Device detection: reads real system info where possible (Linux /proc).
 * On real mobile: replace with native modules (DeviceInfo / expo-device).
 */

import {
  DeviceCapability,
  DeviceInfo,
  ModelInfo,
  ModelStatus,
  Quantization,
} from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/** المسار الفعلي للنموذج المدمج الذي تم تنزيله */
const BUNDLED_MODEL_FILENAME = 'Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';
const BUNDLED_MODEL_PATH = path.join(process.cwd(), 'models', BUNDLED_MODEL_FILENAME);

/** النموذج المدمج الأساسي – Qwen 0.5B Q4_K_M (~380 MB) */
export const BUNDLED_QWEN: ModelInfo = {
  id: 'qwen-local-bundled',
  name: 'Qwen Local',
  version: '2.5-0.5B-Instruct',
  sizeBytes: 397807936, // الحجم الفعلي للملف الذي تم تنزيله
  quantization: 'Q4_K_M',
  ramRequirementGB: 1.0,
  capabilities: ['chat', 'instruction', 'streaming', 'stop-generation'],
  status: 'installed',
  isBundled: true,
  localPath: BUNDLED_MODEL_PATH,
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
    AVAILABLE_MODELS.forEach((m) => this.models.set(m.id, { ...m }));
    // تأكيد وجود الملف الحقيقي للنموذج المدمج
    this.verifyBundledModelExists();
  }

  private verifyBundledModelExists(): void {
    try {
      if (fs.existsSync(BUNDLED_MODEL_PATH)) {
        const stats = fs.statSync(BUNDLED_MODEL_PATH);
        const m = this.models.get(BUNDLED_QWEN.id)!;
        m.sizeBytes = stats.size;
        m.status = 'installed';
        m.localPath = BUNDLED_MODEL_PATH;
        this.models.set(BUNDLED_QWEN.id, m);
      } else {
        const m = this.models.get(BUNDLED_QWEN.id)!;
        m.status = 'not_installed';
        this.models.set(BUNDLED_QWEN.id, m);
      }
    } catch {
      // ignore
    }
  }

  /**
   * فحص مواصفات الجهاز الحقيقي (Linux /proc + os)
   * على الهاتف الحقيقي: استبدل بـ native DeviceInfo / expo-device / React Native DeviceInfo
   */
  async detectDevice(): Promise<DeviceInfo> {
    let ramGB = 2;
    let cpuCores = os.cpus().length || 2;
    let architecture = os.arch();
    let availableStorageGB = 10;
    let osName = os.platform();
    let osVersion = os.release();

    try {
      // RAM الحقيقي من /proc/meminfo
      const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
      const match = meminfo.match(/MemTotal:\s+(\d+)\s+kB/);
      if (match) {
        ramGB = Math.round((parseInt(match[1], 10) / 1024 / 1024) * 10) / 10;
      }
    } catch {}

    try {
      // المساحة المتاحة
      const { execSync } = require('child_process');
      const df = execSync('df -BG / | tail -1').toString();
      const parts = df.trim().split(/\s+/);
      if (parts.length >= 4) {
        availableStorageGB = parseInt(parts[3].replace('G', ''), 10) || 10;
      }
    } catch {}

    let capability: DeviceCapability = 'LOW';
    if (ramGB < 3) capability = 'LOW';
    else if (ramGB < 6) capability = 'MEDIUM';
    else if (ramGB < 12) capability = 'HIGH';
    else capability = 'ULTRA';

    const info: DeviceInfo = {
      ramGB,
      cpuCores,
      architecture,
      availableStorageGB,
      hasGpuAcceleration: false, // على هذا السيرفر لا يوجد GPU مخصص للموبايل
      os: osName,
      osVersion,
      capability,
    };

    this.deviceInfo = info;
    return info;
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  getCapability(): DeviceCapability {
    return this.deviceInfo?.capability ?? 'LOW';
  }

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
    if (!model || model.status !== 'installed') return false;
    if (!this.canRunModel(model)) return false;
    this.activeModelId = id;
    return true;
  }

  canRunModel(model: ModelInfo): boolean {
    const device = this.deviceInfo;
    if (!device) return model.isBundled;
    if (model.ramRequirementGB > device.ramGB * 0.85) return false;
    if (device.capability === 'LOW' && model.ramRequirementGB > 1.5) return false;
    return true;
  }

  /**
   * تنزيل حقيقي للنموذج (يستخدم curl/fetch)
   * يحفظ الملف في models/ ويتحقق من الحجم
   */
  async downloadModel(
    id: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const model = this.models.get(id);
    if (!model) return { success: false, error: 'Model not found' };
    if (model.status === 'installed' && model.localPath && fs.existsSync(model.localPath)) {
      return { success: true };
    }
    if (model.isBundled) {
      this.verifyBundledModelExists();
      return { success: this.models.get(id)?.status === 'installed' };
    }

    const device = this.deviceInfo;
    if (device && model.sizeBytes / (1024 * 1024 * 1024) > device.availableStorageGB * 0.9) {
      return { success: false, error: 'Insufficient storage space' };
    }

    model.status = 'downloading';
    model.downloadProgress = 0;
    this.models.set(id, { ...model });

    // روابط مباشرة معروفة (يمكن توسيعها)
    const downloadUrls: Record<string, string> = {
      // أضف روابط حقيقية هنا عند الحاجة
    };

    const url = downloadUrls[id];
    if (!url) {
      model.status = 'not_installed';
      model.downloadProgress = 0;
      return {
        success: false,
        error: 'No download URL configured for this model. Add the GGUF URL in ModelManager.',
      };
    }

    try {
      const dest = path.join(process.cwd(), 'models', `${id}.gguf`);
      // في تطبيق الموبايل الحقيقي: استخدم expo-file-system downloadResumable
      // هنا نستخدم child_process + curl كتنفيذ حقيقي على السيرفر
      const { spawn } = require('child_process');
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('curl', ['-L', '-o', dest, url, '--progress-bar']);
        proc.on('close', (code: number) => (code === 0 ? resolve() : reject(new Error('curl failed'))));
        proc.on('error', reject);
      });

      if (!fs.existsSync(dest)) {
        throw new Error('Downloaded file missing');
      }
      const stats = fs.statSync(dest);
      model.status = 'installed';
      model.localPath = dest;
      model.sizeBytes = stats.size;
      model.downloadProgress = 1;
      this.models.set(id, { ...model });
      onProgress?.(1);
      return { success: true };
    } catch (e: any) {
      model.status = 'error';
      model.downloadProgress = 0;
      this.models.set(id, { ...model });
      return {
        success: false,
        error: e?.message || 'Model download failed. The model was not installed.',
      };
    }
  }

  cancelDownload(id: string): void {
    const model = this.models.get(id);
    if (model && model.status === 'downloading') {
      model.status = 'not_installed';
      model.downloadProgress = 0;
      this.models.set(id, { ...model });
    }
  }

  async deleteModel(id: string): Promise<{ success: boolean; error?: string }> {
    const model = this.models.get(id);
    if (!model) return { success: false, error: 'Model not found' };
    if (model.isBundled) {
      return { success: false, error: 'Cannot delete the bundled model' };
    }
    if (this.activeModelId === id) {
      this.activeModelId = BUNDLED_QWEN.id;
    }
    if (model.localPath && fs.existsSync(model.localPath)) {
      try {
        fs.unlinkSync(model.localPath);
      } catch {}
    }
    model.status = 'not_installed';
    model.localPath = undefined;
    model.downloadProgress = 0;
    this.models.set(id, { ...model });
    return { success: true };
  }

  async verifyModelIntegrity(id: string): Promise<boolean> {
    const model = this.models.get(id);
    if (!model || model.status !== 'installed' || !model.localPath) return false;
    try {
      if (!fs.existsSync(model.localPath)) return false;
      const stats = fs.statSync(model.localPath);
      // تحقق بسيط من الحجم (في الإنتاج: checksum)
      return stats.size > 100 * 1024 * 1024; // أكبر من 100MB على الأقل
    } catch {
      return false;
    }
  }
}
