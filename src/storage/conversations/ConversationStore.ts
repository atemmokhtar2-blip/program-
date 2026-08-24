/**
 * Conversation Store – تخزين محلي فقط
 * حسب المواصفات: الذاكرة الأساسية على الجهاز
 */

import { Conversation } from '../../types';

// في التطبيق الحقيقي: استخدام AsyncStorage أو SQLite أو MMKV
// هنا in-memory + واجهة جاهزة

export class ConversationStore {
  private conversations: Map<string, Conversation> = new Map();

  async list(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  async get(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }

  async save(conversation: Conversation): Promise<void> {
    conversation.updatedAt = Date.now();
    this.conversations.set(conversation.id, { ...conversation });
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  async search(query: string): Promise<Conversation[]> {
    const q = query.toLowerCase();
    return Array.from(this.conversations.values()).filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }
}
