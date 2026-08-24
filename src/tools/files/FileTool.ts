/**
 * File Tool – قراءة ملفات محلية (حسب صلاحيات النظام)
 * لا يرسل الملفات إلى أي خادم
 */

export class FileTool {
  name = 'files';

  async readTextFile(path: string): Promise<{ success: boolean; content?: string; error?: string }> {
    // في Expo الحقيقي: expo-file-system
    // هنا نرجع خطأ واضح لأننا في بيئة foundation
    return {
      success: false,
      error: 'File access requires native FileSystem module and user permission. Not available in current runtime.',
    };
  }

  async listDirectory(path: string): Promise<{ success: boolean; entries?: string[]; error?: string }> {
    return {
      success: false,
      error: 'Directory listing requires native FileSystem module.',
    };
  }
}
