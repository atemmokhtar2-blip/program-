/**
 * Settings Store – محلي فقط
 */

export interface AppSettings {
  theme: 'dark';
  preferredModelId: string;
  maxContextMessages: number;
  temperature: number;
  enableStreaming: boolean;
  language: 'ar' | 'en';
  showConfidence: boolean;
  autoReleaseMemory: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  preferredModelId: 'qwen-local-bundled',
  maxContextMessages: 20,
  temperature: 0.7,
  enableStreaming: true,
  language: 'ar',
  showConfidence: false,
  autoReleaseMemory: true,
};

export class SettingsStore {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

  async load(): Promise<AppSettings> {
    // في الحقيقي: AsyncStorage
    return { ...this.settings };
  }

  async save(partial: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = { ...this.settings, ...partial };
    // في الحقيقي: حفظ في AsyncStorage
    return { ...this.settings };
  }

  get(): AppSettings {
    return { ...this.settings };
  }
}
